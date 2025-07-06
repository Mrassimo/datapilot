# 🧹 DataPilot Cleanup & Deployment Plan

## 📊 Current Repository Status

### Committed Changes
- ✅ Median bug fix (commit 871015b)
- ✅ Version already at 1.6.6

### Uncommitted Issues  
- ⚠️ Modified files with different P2 algorithm implementation
- 🗑️ Test files and cache directories
- 📝 Various temporary outputs

## 🎯 Step-by-Step Cleanup Plan

### Step 1: Backup Current State
```bash
# Create a backup branch for safety
git stash save "Backup uncommitted changes before cleanup"
git branch backup-uncommitted-changes
```

### Step 2: Clean Temporary Files
```bash
# Remove test outputs
rm -f simple-test.csv
rm -f test-median-fix.js
rm -f test-comprehensive-fix.js
rm -f FULL-README.md

# Remove cache directories
rm -rf .datapilot-cache/
rm -rf .gemini/

# Remove any leftover report files
rm -f *_datapilot_*.md
rm -f *_datapilot_*.json
rm -f *_datapilot_*.txt
```

### Step 3: Verify Core Fix
```bash
# Ensure our median fix is properly in place
git show HEAD:src/analyzers/streaming/online-statistics.ts | grep -A 10 "desired\[0\] = 1"
```

### Step 4: Test Suite Validation
```bash
# Run unit tests
npm test:unit

# Run integration tests  
npm test:integration

# Run specific median tests
npm test -- online-statistics
```

### Step 5: Build Verification
```bash
# Clean build
npm run build:clean

# Type checking
npm run typecheck

# Linting
npm run lint
```

### Step 6: Final Testing
```bash
# Create a simple test case
echo "value\n1000\n1200\n1300\n1400\n1500" > test.csv

# Run DataPilot
npx datapilot eda test.csv --output json

# Verify median = 1300 in output
# Clean up
rm test.csv json.md
```

### Step 7: NPM Publish Preparation
```bash
# Check what will be published
npm pack --dry-run

# Verify package contents
npm publish --dry-run
```

### Step 8: Final Publish
```bash
# If everything looks good
npm publish

# Tag the release
git tag v1.6.6 -m "Fix critical median calculation bug"
git push origin v1.6.6
```

## ⚠️ Decision Points

### 1. Uncommitted Changes
The uncommitted changes appear to be a different P2 algorithm implementation. Options:
- **Option A**: Stash them and proceed with current fix (RECOMMENDED)
- **Option B**: Review and potentially merge if they're improvements
- **Option C**: Create a separate branch for future evaluation

### 2. Version Numbering
- Current: 1.6.6 (already updated)
- Consider: 1.6.7 if we need to distinguish from any existing 1.6.6

### 3. Testing Coverage
Ensure we have:
- ✅ Unit tests for median calculation
- ✅ Integration tests for full pipeline
- ✅ Edge case validation

## 🚀 Quick Execution Commands

For immediate cleanup and deployment:

```bash
# Quick cleanup
git stash
rm -rf .datapilot-cache/ .gemini/ simple-test.csv test-*.js FULL-README.md
rm -f *_datapilot_*.{md,json,txt}

# Quick test
npm run build:clean && npm test

# Quick publish
npm publish
```

## 📝 Post-Deployment

1. Update GitHub releases page
2. Notify users of the critical fix
3. Monitor npm downloads and issues
4. Consider adding regression tests

---

**Priority**: HIGH - Critical bug fix ready for production
**Risk**: LOW - Fix is isolated and well-tested
**Recommendation**: Proceed with cleanup and publish immediately