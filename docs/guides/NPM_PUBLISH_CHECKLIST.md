# NPM Publishing Checklist for DataPilot

## Pre-publish Checklist

### 1. Code Quality
- [ ] All tests pass: `npm test`
- [ ] Coverage is >90%: `npm run test:coverage`
- [ ] No linting errors: `npm run lint`
- [ ] TypeScript compiles: `npm run build`
- [ ] No console.log statements in production code

### 2. Version Management
- [ ] Update version in package.json
- [ ] Update CHANGELOG.md with release notes
- [ ] Tag the release in git: `git tag v1.0.0`

### 3. Documentation
- [ ] README.md is up to date
- [ ] All examples work correctly
- [ ] API documentation is complete
- [ ] Installation instructions tested on:
  - [ ] Windows
  - [ ] macOS
  - [ ] Linux
  - [ ] Behind corporate proxy

### 4. Package Contents
- [ ] Run `npm pack --dry-run` to verify included files
- [ ] Verify .npmignore excludes test files
- [ ] Check package size is reasonable (<5MB)
- [ ] Ensure only dist/ is included, not src/

### 5. Cross-platform Testing
- [ ] Test installation on Windows
- [ ] Test installation on macOS
- [ ] Test installation on Linux
- [ ] Test with different Node.js versions (18, 20, 21)
- [ ] Test behind proxy with authentication

## Publishing Steps

### 1. Login to npm
```bash
npm login
# Or for scoped package
npm login --scope=@datapilot
```

### 2. Final Build
```bash
# Clean build
npm run clean
npm run build

# Run final tests
npm test

# Check what will be published
npm pack --dry-run
```

### 3. Publish
```bash
# For first-time scoped package
npm publish --access public

# For updates
npm publish
```

### 4. Post-publish Verification
```bash
# Wait 2-3 minutes for npm to propagate

# Test installation globally
npm install -g @datapilot/cli

# Test basic command
datapilot --version
datapilot --help

# Test with sample file
datapilot analyze test.csv --sections 1
```

### 5. GitHub Release
- [ ] Create GitHub release with tag
- [ ] Attach npm package tarball
- [ ] Copy CHANGELOG entry to release notes
- [ ] Announce on social media/forums

## Troubleshooting

### "402 Payment Required" Error
- Ensure using `--access public` for scoped packages
- Check npm account has permission for scope

### "EPERM" Error on Windows
- Run terminal as Administrator
- Or use: `npm install -g @datapilot/cli --unsafe-perm`

### Proxy Issues
```bash
# Set proxy for npm
npm config set proxy http://proxy:8080
npm config set https-proxy http://proxy:8080

# For authenticated proxy
npm config set proxy http://user:pass@proxy:8080
```

### Package Not Found After Publish
- Wait 5-10 minutes for propagation
- Check npm website directly
- Clear npm cache: `npm cache clean --force`

## Rollback Procedure

If critical issues found after publish:

```bash
# Deprecate broken version
npm deprecate @datapilot/cli@1.0.0 "Critical bug, use 1.0.1"

# Publish patch immediately
# Update version to 1.0.1
npm version patch
npm publish
```

## Security Checklist
- [ ] No sensitive data in code
- [ ] No hardcoded credentials
- [ ] Dependencies are up to date
- [ ] No security warnings from `npm audit`

---

Remember: Once published, packages cannot be unpublished after 24 hours!