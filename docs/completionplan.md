# DataPilot Bundle Completion - Handover Plan

## Current Status
- ✅ Source code updated with all fixes (pushed to GitHub)
- ❌ Bundled version (`dist/datapilot.js`) still contains old code
- ✅ All enhancements tested and working in source
- ⚠️ Bundle needs rebuilding to incorporate fixes

## Critical Files Modified
1. `/src/utils/parser.js` - Added `normalizePath()`, better encoding detection, progress tracking
2. `/bin/datapilot.js` - Added CLI options, better error handling, version 1.1.1

## Steps to Complete Bundle

### Option 1: Full Dev Setup (Recommended)
```bash
cd C:\Users\61414\Documents\Code\datapilot
npm install                  # Install dev dependencies including rollup
npm run build               # Build new bundle
npm test                    # Run tests to verify
```

### Option 2: Quick Bundle Update
If npm install has issues, try:
```bash
# Install only build tools
npm install --save-dev rollup @rollup/plugin-commonjs @rollup/plugin-json @rollup/plugin-node-resolve rollup-plugin-preserve-shebang

# Build
npm run build
```

### Option 3: Manual Bundle (Last Resort)
If automated build fails, the key changes needed in dist/datapilot.js are:
1. Add normalizePath function from parser.js
2. Update encoding detection logic
3. Add progress callback system
4. Update CLI to version 1.1.1
5. Add --encoding and --delimiter options

## Key Enhancements to Verify After Build

### 1. Path Handling Test
```bash
# Should work without errors
datapilot eda "C:\Test Folder\data with spaces.csv"
```

### 2. Encoding Test
```bash
# Should show encoding options in help
datapilot --help | findstr encoding
```

### 3. Progress Test
```bash
# Should show progress for larger files
datapilot all some_large_file.csv
```

### 4. Version Test
```bash
# Should show 1.1.1
datapilot --version
```

## Potential Issues & Solutions

### Issue 1: Rollup Build Errors
**Symptom**: `rollup is not recognized`
**Solution**: 
```bash
npm install --global rollup
# OR use npx
npx rollup -c
```

### Issue 2: Module Resolution Errors
**Symptom**: Cannot find module errors during build
**Solution**: Check rollup.config.js, ensure all imports are resolved

### Issue 3: Bundle Too Large
**Symptom**: dist/datapilot.js > 5MB
**Solution**: Check for duplicate dependencies, use tree-shaking

## Testing Checklist After Build

- [ ] Help command shows new options
- [ ] Version shows 1.1.1
- [ ] Path with spaces: `datapilot eda "C:\My Folder\test.csv"`
- [ ] Encoding option: `datapilot all data.csv --encoding latin1`
- [ ] Delimiter option: `datapilot all data.csv --delimiter ";"`
- [ ] Progress shows for large files
- [ ] Error messages are helpful
- [ ] UI mode works: `datapilot ui`
- [ ] Multiple files: `datapilot eng analyze *.csv`

## Quick Verification Script
```batch
@echo off
echo Testing DataPilot Bundle...
echo.

echo 1. Version Check:
datapilot --version

echo.
echo 2. Help Check (should show encoding):
datapilot --help | findstr /i "encoding delimiter"

echo.
echo 3. Path Test:
echo name,value > "test with spaces.csv"
echo test,123 >> "test with spaces.csv"
datapilot eda "test with spaces.csv" --quick
del "test with spaces.csv"

echo.
echo Bundle verification complete!
```

## Rollback Plan
If build fails or introduces bugs:
```bash
# Backup current dist
copy dist\datapilot.js dist\datapilot.js.backup

# If needed, restore from GitHub
git checkout HEAD~2 -- dist/datapilot.js
```

## Success Criteria
The bundle is complete when:
1. `datapilot --version` shows 1.1.1
2. Paths with spaces work without errors
3. `--encoding` and `--delimiter` options are available
4. Progress indicators appear during processing
5. All test files pass analysis

## Next Context Notes
If starting fresh:
1. Main changes are in `/src/utils/parser.js` and `/bin/datapilot.js`
2. Key function is `normalizePath()` for Windows paths
3. Version should be 1.1.1
4. Test with files in `C:\Users\61414\Desktop\datapilot_tests\`
5. Installation scripts are ready in root directory

## Contact for Issues
Repository: https://github.com/Mrassimo/datapilot
Changed files: parser.js, bin/datapilot.js
Commits: cfcf32f (fixes), 0f6f183 (installation)
