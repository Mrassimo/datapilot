# CI/CD Status Badges

Add these badges to your README.md to display the current status of your CI/CD pipeline.

## CI/CD Pipeline Badges

```markdown
<!-- CI/CD Pipeline Status -->
[![CI/CD Pipeline](https://github.com/Mrassimo/datapilot/actions/workflows/ci.yml/badge.svg)](https://github.com/Mrassimo/datapilot/actions/workflows/ci.yml)

<!-- Code Coverage -->
[![codecov](https://codecov.io/gh/Mrassimo/datapilot/branch/main/graph/badge.svg)](https://codecov.io/gh/Mrassimo/datapilot)

<!-- Security Score -->
[![Security](https://github.com/Mrassimo/datapilot/actions/workflows/ci.yml/badge.svg?event=schedule)](https://github.com/Mrassimo/datapilot/security)

<!-- Node.js Version -->
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

<!-- NPM Version -->
[![npm version](https://badge.fury.io/js/datapilot-cli.svg)](https://badge.fury.io/js/datapilot-cli)

<!-- License -->
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

<!-- Cross-Platform -->
[![Platform](https://img.shields.io/badge/platform-linux%20%7C%20macos%20%7C%20windows-lightgrey.svg)](https://github.com/Mrassimo/datapilot)
```

## Individual Component Badges

### Test Coverage by Component
```markdown
<!-- Unit Tests -->
[![Unit Tests](https://img.shields.io/badge/tests-unit-green.svg)](https://github.com/Mrassimo/datapilot/actions)

<!-- Integration Tests -->
[![Integration Tests](https://img.shields.io/badge/tests-integration-green.svg)](https://github.com/Mrassimo/datapilot/actions)

<!-- E2E Tests -->
[![E2E Tests](https://img.shields.io/badge/tests-e2e-green.svg)](https://github.com/Mrassimo/datapilot/actions)
```

### Security Badges
```markdown
<!-- Known Vulnerabilities -->
[![Known Vulnerabilities](https://snyk.io/test/github/Mrassimo/datapilot/badge.svg)](https://snyk.io/test/github/Mrassimo/datapilot)

<!-- Dependencies -->
[![Dependencies](https://img.shields.io/david/Mrassimo/datapilot.svg)](https://david-dm.org/Mrassimo/datapilot)

<!-- Dev Dependencies -->
[![DevDependencies](https://img.shields.io/david/dev/Mrassimo/datapilot.svg)](https://david-dm.org/Mrassimo/datapilot?type=dev)
```

### Quality Badges
```markdown
<!-- Code Quality -->
[![Code Quality](https://img.shields.io/badge/code%20quality-A-brightgreen.svg)](https://github.com/Mrassimo/datapilot)

<!-- Bundle Size -->
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/datapilot-cli.svg)](https://bundlephobia.com/result?p=datapilot-cli)

<!-- Downloads -->
[![Downloads](https://img.shields.io/npm/dm/datapilot-cli.svg)](https://www.npmjs.com/package/datapilot-cli)
```

## Complete Badge Section for README

Here's a complete section you can copy directly into your README.md:

```markdown
## Status

[![CI/CD Pipeline](https://github.com/Mrassimo/datapilot/actions/workflows/ci.yml/badge.svg)](https://github.com/Mrassimo/datapilot/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/Mrassimo/datapilot/branch/main/graph/badge.svg)](https://codecov.io/gh/Mrassimo/datapilot)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![npm version](https://badge.fury.io/js/datapilot-cli.svg)](https://badge.fury.io/js/datapilot-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/platform-linux%20%7C%20macos%20%7C%20windows-lightgrey.svg)](https://github.com/Mrassimo/datapilot)

| Aspect | Status |
|--------|--------|
| **Tests** | ✅ Unit, Integration, E2E |
| **Security** | ✅ Daily scans, vulnerability monitoring |
| **Performance** | ✅ Regression detection |
| **Bundle Size** | ✅ Monitored and optimised |
| **Cross-Platform** | ✅ Linux, macOS, Windows |
| **Coverage** | [![codecov](https://codecov.io/gh/Mrassimo/datapilot/branch/main/graph/badge.svg)](https://codecov.io/gh/Mrassimo/datapilot) |
```

## Custom Badges

You can create custom badges using [shields.io](https://shields.io/):

```markdown
<!-- Custom Performance Badge -->
[![Performance](https://img.shields.io/badge/performance-optimised-brightgreen.svg)](https://github.com/Mrassimo/datapilot/actions)

<!-- Custom Security Badge -->
[![Security](https://img.shields.io/badge/security-monitored-blue.svg)](https://github.com/Mrassimo/datapilot/security)

<!-- Custom Bundle Size Badge -->
[![Bundle](https://img.shields.io/badge/bundle-10MB%20max-orange.svg)](https://github.com/Mrassimo/datapilot/actions)
```

## Dynamic Badges with GitHub Actions

You can create dynamic badges that update based on your CI results:

```yaml
# Add this to your workflow to create dynamic badges
- name: Create Coverage Badge
  uses: schneegans/dynamic-badges-action@v1.6.0
  with:
    auth: ${{ secrets.GITHUB_TOKEN }}
    gistID: your-gist-id
    filename: coverage.json
    label: Coverage
    message: ${{ steps.coverage.outputs.percentage }}%
    color: green
```

## Badge Guidelines

1. **Keep it relevant**: Only show badges that provide value to users
2. **Update regularly**: Ensure badges reflect current status
3. **Consistent styling**: Use similar badge styles for a professional look
4. **Logical order**: Place most important badges first
5. **Link to details**: Make badges clickable to relevant pages

## Troubleshooting Badges

### Badge not updating
- Check if the action URL is correct
- Verify repository permissions
- Clear browser cache
- Check GitHub Actions status

### Badge showing "unknown"
- Ensure the workflow has run at least once
- Check if the badge references the correct branch
- Verify the workflow file exists and is properly configured