## [1.4.14](https://github.com/Mrassimo/datapilot/compare/v1.4.13...v1.4.14) (2025-06-28)


### Bug Fixes

* resolve Issues [#34](https://github.com/Mrassimo/datapilot/issues/34) and [#35](https://github.com/Mrassimo/datapilot/issues/35) with critical runtime bug fixes ([75b7c72](https://github.com/Mrassimo/datapilot/commit/75b7c724b67d2e5f4714b358a4fa04c98c03a70e)), closes [#36](https://github.com/Mrassimo/datapilot/issues/36)

## [1.4.13](https://github.com/Mrassimo/datapilot/compare/v1.4.12...v1.4.13) (2025-06-28)


### Bug Fixes

* optimize npm package size by excluding source maps and development files ([44ba35f](https://github.com/Mrassimo/datapilot/commit/44ba35fa91a685687df76c331e46689a1f9212c3))
* resolve 400+ files in releases by fixing semantic-release configuration ([1fcc844](https://github.com/Mrassimo/datapilot/commit/1fcc844eec6ca87bd91720198d374f1167be6ece))

## [1.4.12](https://github.com/Mrassimo/datapilot/compare/v1.4.11...v1.4.12) (2025-06-28)


### Bug Fixes

* resolve critical v1.4.11 issues and add automated tgz publishing ([3644926](https://github.com/Mrassimo/datapilot/commit/3644926feb7ff5af70e5f58d4df630599ac71052)), closes [#34](https://github.com/Mrassimo/datapilot/issues/34) [#35](https://github.com/Mrassimo/datapilot/issues/35) [#36](https://github.com/Mrassimo/datapilot/issues/36)

## [1.4.11](https://github.com/Mrassimo/datapilot/compare/v1.4.10...v1.4.11) (2025-06-28)


### Bug Fixes

* add NPM token authentication test documentation ([c4771f7](https://github.com/Mrassimo/datapilot/commit/c4771f7f29aaf5745c8296b21bffd4e738d2552e))
* correct NPM token authentication in CI workflow ([eecdd29](https://github.com/Mrassimo/datapilot/commit/eecdd29fbf6a67f7ca00d41befacd7915ffeb340))
* test NPM token configuration with automated release ([e96186c](https://github.com/Mrassimo/datapilot/commit/e96186ccdea5266afa1b5eb7649c582b74457e33))

# Changelog

All notable changes to DataPilot will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2025-06-15

### Added
- **Major Feature**: Unsupervised ML recommendations system (GitHub Issue #22)
  - UnsupervisedAnalyzer with 1,875 lines of advanced ML capabilities
  - 5 types of synthetic target generation (clustering, outlier, composite, temporal, domain-derived)
  - AutoML platform recommendations (H2O, AutoGluon, etc.)
  - Feature engineering recipe automation
  - Section 6 now always provides modeling opportunities, never returns "0 tasks"

- **Major Feature**: Smart performance auto-configuration (GitHub Issue #23)
  - SmartResourceManager for automatic system resource detection and optimization
  - SectionCacheManager with intelligent memory/disk caching and TTL management
  - CLI performance options: --auto-config, --preset, --threads, --cache, --streaming
  - 5 performance presets (ultra-large-files, large-files, balanced, speed-optimized, memory-constrained)
  - Performance dashboard (datapilot perf) and cache management (datapilot clear-cache)
  - Automatic performance optimization based on file size and system capabilities

### Technical Implementation
- Added 4 new TypeScript files with 3,000+ lines of production-ready code
- Full integration with existing DataPilot architecture and dependency injection
- Comprehensive error handling, logging, and memory management
- Zero TypeScript compilation errors, full type safety maintained
- British English spelling consistency throughout
- Backward compatibility preserved

### Fixed
- ESLint empty block statement error in section-cache-manager
- UnsupervisedAnalyzer column property access errors
- CI/CD pipeline linting stage failures

## [1.3.3] - 2024-12-XX

### Fixed
- Comprehensive CI/CD pipeline test failures resolution
- E2E CLI command parsing errors
- Windows privacy mode test compatibility across CI environments
- Large file test performance optimization with caching system
- Security vulnerability management (CVE-2023-30533, CVE-2024-22363)
- GitHub Actions workflow permissions for binary uploads
- Jest test infrastructure and coverage reporting

### Enhanced
- Cross-platform testing compatibility (Windows, macOS, Linux)
- Test performance with reduced file sizes and caching
- Repository organization and file structure cleanup
- GitHub Release automation for git tags

## [1.3.2] - 2024-12-XX

### Fixed
- Critical test infrastructure issues
- Jest functionality restoration
- CI/CD pipeline resolution with 97.5% test success rate

## [1.3.1] - 2024-12-XX

### Added
- Complete WCAG accessibility compliance implementation
- Comprehensive visualization system with accessibility features
- Advanced statistical analysis capabilities

### Fixed
- Accessibility module test coverage
- Visualization rendering performance
- Output formatting consistency

## [1.2.0] - 2024-11-XX

### Added
- Enhanced engineering analysis features
- Multi-file relationship analysis
- Streaming statistical computation engine
- 6-section analysis pipeline architecture

### Enhanced
- Memory management and resource optimization
- Error handling and reporting system
- Configuration system with environment overrides

## [1.1.x] - 2024-10-XX

### Added
- Core CSV processing and analysis functionality
- Basic CLI interface
- Statistical analysis modules
- Quality assessment features

## [1.0.x] - 2024-09-XX

### Added
- Initial release of DataPilot
- Basic CSV parsing and analysis
- Command-line interface
- Core statistical functions
