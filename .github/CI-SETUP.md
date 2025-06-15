# Enhanced CI/CD Pipeline Configuration

This document describes the setup and configuration requirements for the enhanced CI/CD pipeline.

## Required Secrets

The following secrets need to be configured in your GitHub repository settings:

### Required Secrets
- `CODECOV_TOKEN`: Token for Codecov integration (code coverage reporting)
- `NPM_TOKEN`: NPM authentication token for publishing packages

### Optional Secrets (Enhanced Features)
- `SNYK_TOKEN`: Snyk token for advanced vulnerability scanning
  - Sign up at [snyk.io](https://snyk.io) and get your token
  - Enables additional security vulnerability detection beyond npm audit

## Environment Variables

The pipeline uses the following environment variables (configured in workflow):

- `NODE_VERSION`: Node.js version to use (default: '18')
- `PERFORMANCE_BASELINE_BRANCH`: Branch to compare performance against (default: 'main')
- `BUNDLE_SIZE_LIMIT`: Maximum allowed bundle size in bytes (default: 10MB)
- `BUNDLE_SIZE_WARNING`: Warning threshold for bundle size in bytes (default: 8MB)

## Features Overview

### 1. Enhanced Testing & Coverage
- **Matrix Testing**: Tests across Node.js 18 and 20
- **Conditional Coverage**: Runs coverage only on specific matrix configurations
- **Multiple Coverage Reporters**: Codecov integration with detailed reporting
- **Coverage Artifacts**: Uploads coverage reports for debugging

### 2. Bundle Size Monitoring
- **Size Tracking**: Monitors JavaScript bundle size
- **Change Detection**: Compares bundle size changes against baseline
- **Thresholds**: Configurable size limits and warnings
- **Reporting**: Detailed bundle analysis reports

### 3. Performance Regression Detection
- **Automated Benchmarking**: Runs performance tests on pull requests
- **Baseline Comparison**: Compares against main branch performance
- **Regression Alerts**: Fails CI if performance degrades significantly (>50%)
- **Performance Reports**: Detailed timing and comparison metrics

### 4. Comprehensive Security Scanning
- **Multi-Tool Approach**: npm audit, GitHub Security Advisories, optional Snyk
- **Vulnerability Severity**: Fails on critical vulnerabilities in runtime dependencies
- **License Compliance**: Checks for problematic licenses (GPL variants)
- **Dependency Confusion**: Analyzes risk of dependency confusion attacks
- **Secret Scanning**: Basic pattern matching for hardcoded secrets
- **CodeQL Integration**: Enhanced code analysis with custom configuration

### 5. Enhanced Cross-Platform Testing
- **Platform Matrix**: Tests on Ubuntu, Windows, and macOS
- **Platform-Specific Logic**: Handles OS differences in CLI testing
- **Optimised Caching**: Platform-specific dependency caching
- **Comprehensive CLI Testing**: Tests basic functionality on each platform

### 6. CI/CD Metrics & Reporting
- **Pipeline Metrics**: Comprehensive reporting of CI/CD pipeline status
- **Artifact Analysis**: Summarises all generated artifacts
- **Quality Gates**: Reports on all quality checks
- **PR Comments**: Automatic reporting on pull requests

### 7. Daily Security Monitoring
- **Scheduled Scans**: Daily security scans at 2 AM UTC
- **Comprehensive Auditing**: Full dependency vulnerability scanning
- **Update Tracking**: Monitors outdated dependencies
- **Alert System**: Could be extended to create GitHub issues for critical findings

## Caching Strategy

The pipeline implements aggressive caching for performance:

- **Dependency Caching**: NPM dependencies cached per Node.js version and OS
- **Build Artifact Caching**: TypeScript compilation results cached
- **Jest Cache**: Test runner cache for faster subsequent runs
- **Platform-Specific**: Separate caches for different operating systems

## Artifact Management

The pipeline generates and manages multiple artifacts:

### Short-term Artifacts (7 days)
- Build artifacts (`dist/`)
- Coverage reports
- Cross-platform test results
- Performance reports

### Long-term Artifacts (30-90 days)
- Security reports
- Bundle analysis
- CI metrics reports
- Daily security monitoring reports

## Quality Gates

The pipeline enforces several quality gates:

1. **Linting**: ESLint checks must pass
2. **Type Checking**: TypeScript compilation must succeed
3. **Unit Tests**: All unit tests must pass
4. **Integration Tests**: Integration tests must pass
5. **Security**: No critical vulnerabilities in runtime dependencies
6. **Bundle Size**: Bundle size must not exceed configured limits
7. **Performance**: Performance regression must not exceed 50%
8. **Cross-Platform**: Must work on all supported platforms

## Workflow Triggers

The pipeline runs on:
- **Push**: to main and develop branches
- **Pull Request**: to main branch
- **Tag Push**: version tags (v*)
- **Release**: published releases
- **Schedule**: daily security scans at 2 AM UTC

## Setup Instructions

1. **Configure Secrets**:
   ```bash
   # In GitHub repository settings > Secrets and variables > Actions
   # Add the required secrets listed above
   ```

2. **Codecov Setup**:
   - Sign up at [codecov.io](https://codecov.io)
   - Add your repository
   - Copy the repository token to `CODECOV_TOKEN` secret

3. **NPM Setup**:
   - Generate an NPM token with publish permissions
   - Add to `NPM_TOKEN` secret

4. **Optional Snyk Setup**:
   - Sign up at [snyk.io](https://snyk.io)
   - Get your authentication token
   - Add to `SNYK_TOKEN` secret

## Customisation

### Bundle Size Limits
Adjust in the workflow environment variables:
```yaml
env:
  BUNDLE_SIZE_LIMIT: 10485760  # 10MB in bytes
  BUNDLE_SIZE_WARNING: 8388608  # 8MB in bytes
```

### Performance Thresholds
Modify the performance regression detection thresholds in the `performance-test` job.

### Security Thresholds
Adjust vulnerability severity levels in the security scanning jobs.

### Caching Behaviour
Modify cache keys and paths in the individual job steps.

## Troubleshooting

### Common Issues

1. **Codecov Upload Failures**:
   - Verify `CODECOV_TOKEN` is correctly set
   - Check network connectivity
   - Review Codecov documentation for repository setup

2. **Bundle Size Failures**:
   - Check if bundle size has genuinely increased
   - Review recent changes for unnecessary dependencies
   - Consider optimising imports and tree-shaking

3. **Performance Regression**:
   - Verify the performance test is using consistent data
   - Check for resource contention in CI environment
   - Review recent code changes for performance impacts

4. **Security Scan Failures**:
   - Review security report artifacts
   - Update dependencies with known vulnerabilities
   - Consider security patches or alternatives

### Debug Mode

To enable verbose logging, modify the workflow steps to include debugging flags:
```yaml
- name: Debug Step
  run: |
    set -x  # Enable verbose output
    # Your commands here
```

## Monitoring and Maintenance

- **Regular Review**: Check CI metrics reports weekly
- **Security Updates**: Address security findings promptly
- **Performance Monitoring**: Watch for performance degradation trends
- **Dependency Updates**: Keep dependencies current
- **Cache Cleanup**: Monitor cache usage and clean if necessary

## Future Enhancements

Potential improvements to consider:
- Integration with SonarQube for code quality
- Deployment automation for staging environments
- Advanced performance profiling
- Integration with monitoring tools
- Automated dependency updates (Dependabot, Renovate)
- Container security scanning
- End-to-end test automation