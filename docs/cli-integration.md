# CLI Integration - Sequential Execution Engine

## Overview

The DataPilot CLI now seamlessly integrates an advanced sequential execution engine that provides:
- **Perfect backward compatibility** - Existing commands work exactly as before
- **Intelligent execution mode selection** - Automatically chooses optimal execution strategy
- **Real dependency resolution** - Section 6 now gets real data instead of mocks
- **Enhanced memory management** - Better handling of large datasets
- **Result caching** - Improved performance for repeated analyses

## Execution Modes

### 1. Individual Execution (Legacy Mode)
Used for single sections without dependencies for maximum performance:
- Section 1 (Overview) - No dependencies
- Section 2 (Quality) - No dependencies  
- Section 3 (EDA) - No dependencies

**Example:**
```bash
datapilot overview file.csv       # Uses individual execution
datapilot quality file.csv        # Uses individual execution
datapilot eda file.csv           # Uses individual execution
```

### 2. Sequential Execution (New Mode)
Automatically used when:
- Multiple sections are requested
- Any section with dependencies is requested (Sections 4, 5, or 6)
- Command is 'all', 'analysis', or 'modeling'

**Example:**
```bash
datapilot modeling file.csv      # Uses sequential (Section 6 needs deps)
datapilot all file.csv          # Uses sequential (full pipeline)
datapilot all file.csv --sections 1,3,5  # Uses sequential (multiple)
```

## Key Benefits

### 1. True Dependency Resolution
Previously, Section 6 (Modeling) received mock data for its dependencies. Now it receives:
- Real Section 1 results (metadata, column inventory)
- Real Section 2 results (quality audit scores)
- Real Section 3 results (statistical analysis)
- Real Section 5 results (ML readiness assessment)

### 2. Automatic Optimization
The CLI intelligently decides the best execution mode:
```
Single section without deps → Individual execution (fast)
Multiple sections or deps → Sequential execution (optimal)
```

### 3. Memory Management
Sequential execution provides:
- Automatic cleanup between sections
- Memory usage tracking
- Rollback capabilities on failure
- Resource pooling and reuse

### 4. Result Caching
- Automatic caching of section results
- Cache invalidation on failures
- Persistent cache across runs (when enabled)

## CLI Options

### Execution Control Flags

**Force Sequential Mode:**
```bash
datapilot overview file.csv --force-sequential
```
Forces sequential execution even for single sections without dependencies.

**Force Individual Mode:**
```bash
datapilot modeling file.csv --force-individual
```
Forces individual execution (legacy mode) even for sections with dependencies.
Warning: This will use mock data for dependencies!

**Disable Fallback:**
```bash
datapilot modeling file.csv --no-fallback
```
By default, if sequential execution fails, the system falls back to individual execution.
This flag disables that fallback.

**Continue on Error:**
```bash
datapilot all file.csv --continue-on-error
```
Continue executing remaining sections even if some fail.

### Caching Options

**Enable Caching:**
```bash
datapilot all file.csv --cache
```

**Set Cache Size:**
```bash
datapilot all file.csv --cache-size 100  # 100MB cache
```

**Disable Caching:**
```bash
datapilot all file.csv --no-cache
```

## Backward Compatibility

### What's Preserved
1. **All existing commands work identically**
   - `datapilot overview file.csv` → Same output
   - `datapilot quality file.csv` → Same output
   - Performance characteristics preserved for single sections

2. **All existing options work**
   - Output formats (--format)
   - Section selection (--sections)
   - All section-specific options

3. **Error behavior**
   - Same error messages
   - Same exit codes
   - Same suggestions

### What's Enhanced
1. **Section 6 receives real data** instead of mocks
2. **Better memory handling** for large files
3. **Automatic dependency resolution**
4. **Optional result caching**

## Examples

### Basic Usage (Unchanged)
```bash
# Single section analysis - uses individual execution
datapilot overview sales.csv
datapilot quality sales.csv
datapilot eda sales.csv

# These work exactly as before!
```

### Advanced Analysis (Enhanced)
```bash
# Modeling with real dependencies - uses sequential
datapilot modeling sales.csv

# Full pipeline - uses sequential with memory optimization
datapilot all sales.csv

# Multi-file analysis with caching
datapilot eng customers.csv orders.csv --cache
```

### Debugging and Control
```bash
# See execution mode decisions
datapilot modeling sales.csv --verbose

# Force legacy behavior
datapilot all sales.csv --force-individual

# Force new behavior
datapilot overview sales.csv --force-sequential

# Handle errors gracefully
datapilot all problematic.csv --continue-on-error
```

## Performance Characteristics

### Individual Execution
- **Pros:** Fastest for single sections, minimal memory overhead
- **Cons:** Uses mock data for dependencies
- **Use when:** Analyzing single sections without dependencies

### Sequential Execution  
- **Pros:** Real dependency data, better memory management, caching
- **Cons:** Slight overhead for dependency resolution
- **Use when:** Running multiple sections or sections with dependencies

## Migration Guide

### For Existing Scripts
No changes needed! All existing scripts will continue to work:

```bash
# These scripts work without modification
./my-analysis-script.sh
datapilot quality data.csv | grep "Quality Score"
```

### For New Development
Take advantage of new features:

```bash
# Enable caching for repeated analyses
datapilot all large-file.csv --cache

# Use real dependencies for modeling
datapilot modeling data.csv  # Automatically uses sequential

# Handle large datasets better
datapilot all huge-file.csv --streaming --progressive
```

## Troubleshooting

### Issue: Unexpected execution mode
**Solution:** Use --verbose to see mode selection logic:
```bash
datapilot modeling file.csv --verbose
```

### Issue: Sequential execution failing
**Solution:** Fall back to individual mode:
```bash
datapilot modeling file.csv --force-individual
```

### Issue: Memory issues with large files
**Solution:** Enable streaming and caching:
```bash
datapilot all large.csv --streaming --cache --max-memory 512
```

### Issue: Want old behavior exactly
**Solution:** Force individual execution:
```bash
datapilot all file.csv --force-individual --no-cache
```

## Technical Details

### Execution Mode Decision Logic
```
if (forceSequential) → Sequential
else if (forceIndividual) → Individual  
else if (sections with dependencies) → Sequential
else if (multiple sections) → Sequential
else if (command in ['all', 'analysis', 'modeling']) → Sequential
else → Individual
```

### Dependency Graph
```
Section 1 → No dependencies
Section 2 → No dependencies
Section 3 → No dependencies
Section 4 → Depends on Sections 1, 3
Section 5 → Depends on Sections 1, 2, 3
Section 6 → Depends on Sections 1, 2, 3, 5
```

### Cache Behavior
- Cache key: file path + section + options
- TTL: Based on section execution time
- Invalidation: On upstream section failure
- Storage: Memory (default) or disk (persistent)

## Summary

The CLI integration provides a seamless upgrade path that:
1. **Preserves all existing functionality** - 100% backward compatible
2. **Enhances complex analyses** - Real dependency data for Section 6
3. **Improves performance** - Caching and memory management
4. **Maintains simplicity** - Automatic mode selection

Users get the benefits of the new system without changing their workflows!