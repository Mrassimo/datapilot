# DataPilot Release Checklist

This checklist ensures comprehensive testing and quality assurance before each release.

## Pre-Release Testing

### 1. Code Quality
- [ ] All ESLint errors resolved (`npm run lint`)
- [ ] TypeScript compilation successful (`npm run typecheck`)
- [ ] Code coverage > 90% (`npm run test:coverage`)
- [ ] No security vulnerabilities (`npm audit`)
- [ ] Dependencies up to date

### 2. Unit & Integration Testing
- [ ] All unit tests passing (`npm run test:unit`)
- [ ] All integration tests passing (`npm run test:e2e`)
- [ ] Phase 3 module integration tests passing
- [ ] Cross-section validation tests passing
- [ ] Performance regression tests passing

### 3. E2E Testing
- [ ] CLI installation test (`npm run test:installation`)
- [ ] Basic CSV analysis workflow
- [ ] Large file processing (>100MB)
- [ ] Multiple format support (CSV, JSON, Excel)
- [ ] Cross-platform compatibility (Windows, macOS, Linux)
- [ ] Memory constraint testing
- [ ] Error handling edge cases

### 4. Package Validation
- [ ] Package structure validation (`node scripts/validate-package.js`)
- [ ] CLI functionality test
- [ ] Binary generation (`npm run build:all-platforms`)
- [ ] Package size within limits (<50MB)
- [ ] All required files included

### 5. Documentation
- [ ] README.md updated with new features
- [ ] CHANGELOG.md updated with version changes
- [ ] API documentation current
- [ ] Examples and tutorials verified
- [ ] Installation instructions tested

## Release Process

### 1. Version Preparation
- [ ] Version number follows semantic versioning
- [ ] package.json version updated
- [ ] CHANGELOG.md entry added
- [ ] Git branch is clean (no uncommitted changes)
- [ ] All tests passing

### 2. Release Creation
- [ ] Run release automation (`npm run release`)
- [ ] Git tag created
- [ ] Changes committed and pushed
- [ ] GitHub release created
- [ ] Release notes written

### 3. Publishing
- [ ] NPM package published automatically via GitHub Actions
- [ ] Cross-platform binaries uploaded to release
- [ ] Package available on NPM registry
- [ ] Installation test from NPM registry

### 4. Post-Release Verification
- [ ] NPM package installable globally
- [ ] CLI works after global installation
- [ ] Documentation links working
- [ ] GitHub release assets downloadable
- [ ] Binaries executable on target platforms

## Emergency Rollback

If critical issues are discovered post-release:

1. [ ] Document the issue
2. [ ] Determine if hotfix or rollback needed
3. [ ] If rollback: `npm unpublish datapilot-cli@VERSION` (within 24h)
4. [ ] If hotfix: Follow abbreviated release process
5. [ ] Update documentation with lessons learned

## Platform-Specific Testing

### Windows
- [ ] Installation via NPM
- [ ] Installation via binary
- [ ] Path with spaces handling
- [ ] PowerShell compatibility
- [ ] Command Prompt compatibility
- [ ] Corporate proxy environment

### macOS
- [ ] Installation via NPM
- [ ] Installation via Homebrew (if applicable)
- [ ] Installation via binary
- [ ] Terminal compatibility
- [ ] Apple Silicon (M1/M2) compatibility
- [ ] Gatekeeper/notarization (for binaries)

### Linux
- [ ] Installation via NPM
- [ ] Installation via binary
- [ ] Ubuntu/Debian compatibility
- [ ] CentOS/RHEL compatibility
- [ ] Alpine Linux compatibility
- [ ] Permission handling

## Performance Benchmarks

### Dataset Sizes
- [ ] Small files (<1MB): < 5 seconds
- [ ] Medium files (1-100MB): < 30 seconds
- [ ] Large files (100MB-1GB): < 5 minutes
- [ ] Memory usage < 512MB for any file size
- [ ] No memory leaks in extended usage

### Analysis Quality
- [ ] All 6 sections generate meaningful output
- [ ] Statistical accuracy verified
- [ ] Visualization recommendations appropriate
- [ ] ML recommendations relevant
- [ ] Phase 3 advanced capabilities functional

## Security Checklist

- [ ] No hardcoded credentials or secrets
- [ ] Input validation for all CLI arguments
- [ ] File path traversal protection
- [ ] Dependency security audit clean
- [ ] No eval() or dangerous code execution
- [ ] Error messages don't leak sensitive info

## Compliance & Legal

- [ ] MIT license properly applied
- [ ] No GPL or copyleft dependencies
- [ ] Copyright notices updated
- [ ] Third-party attributions included
- [ ] Export control compliance

---

**Release Manager:** _[Name]_  
**Release Date:** _[Date]_  
**Version:** _[Version Number]_  
**Approval:** _[Signature/Approval]_
