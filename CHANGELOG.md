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