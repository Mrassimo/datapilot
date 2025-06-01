# Changelog

All notable changes to DataPilot will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0-cli-only] - 2025-01-06

### Changed
- Complete removal of TUI (Terminal User Interface) components
- Streamlined to CLI-only functionality
- Reduced dependencies from ~120 to ~25 packages
- Simplified test suite focusing on CLI commands

### Fixed
- CSV parser cast function header row bug
- Various Windows compatibility issues

### Removed
- All TUI-related code and dependencies
- Interactive file browser
- Demo mode functionality

## [1.1.1] - Previous version
- Last version with TUI support
