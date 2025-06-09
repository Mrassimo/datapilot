# Working with Large Files

DataPilot is designed to handle CSV files of any size efficiently through its streaming architecture. This guide covers best practices for analyzing large datasets.

## Automatic Streaming

DataPilot automatically switches to streaming mode for files over 100MB. No configuration needed!

## Memory Management

### 1. Use Presets

For files over 1GB, use the low-memory preset:
```bash
datapilot analyze large-file.csv --preset low-memory
```

### 2. Adjust Memory Limits

Set explicit memory limits:
```bash
# Limit to 512MB
datapilot analyze huge.csv --memory-limit 512

# Increase Node.js heap
NODE_OPTIONS="--max-old-space-size=4096" datapilot analyze massive.csv
```

### 3. Limit Row Processing

Process only a subset of rows:
```bash
# Analyze first 1 million rows
datapilot analyze huge.csv --max-rows 1000000

# Sample analysis
datapilot analyze huge.csv --sample-size 50000
```

## Performance Tips

### 1. Run Specific Sections

Don't run all sections if not needed:
```bash
# Just overview and quality
datapilot analyze large.csv --sections 1,2
```

### 2. Use JSON Output

JSON is more memory-efficient than markdown for large results:
```bash
datapilot analyze large.csv --format json --output results.json
```

### 3. Disable Multivariate Analysis

For very large files, disable memory-intensive analyses:
```bash
datapilot analyze huge.csv --no-multivariate
```

## File Size Guidelines

| File Size | Recommended Settings |
|-----------|---------------------|
| < 100MB   | Default settings work well |
| 100MB-1GB | Automatic streaming kicks in |
| 1GB-10GB  | Use `--preset low-memory` |
| > 10GB    | Use custom limits and sampling |

## Example: 10GB File

```bash
# Optimal settings for a 10GB CSV
NODE_OPTIONS="--max-old-space-size=2048" datapilot analyze massive.csv \
  --preset low-memory \
  --max-rows 5000000 \
  --sections 1,2,3 \
  --format json \
  --output analysis.json
```

## Chunked Processing

For extremely large files, process in chunks:

```bash
#!/bin/bash
# analyze-chunks.sh

# Split large file
split -l 1000000 huge.csv chunk_

# Analyze each chunk
for chunk in chunk_*; do
  datapilot analyze "$chunk" --output "${chunk}_analysis.json"
done

# Combine results (custom script needed)
```

## Memory Monitoring

Monitor memory usage during analysis:
```bash
# Linux/macOS
datapilot analyze large.csv --verbose 2>&1 | grep -E "Memory|memory"

# Windows PowerShell
datapilot analyze large.csv --verbose 2>&1 | Select-String "Memory|memory"
```

## Troubleshooting

### Out of Memory Errors

```bash
# Solution 1: Increase heap size
NODE_OPTIONS="--max-old-space-size=8192" datapilot analyze huge.csv

# Solution 2: Use sampling
datapilot analyze huge.csv --sample-size 100000

# Solution 3: Process fewer rows
datapilot analyze huge.csv --max-rows 1000000
```

### Slow Performance

```bash
# Use faster output format
datapilot analyze large.csv --format json --quiet

# Skip expensive analyses
datapilot analyze large.csv --sections 1,2 --no-multivariate
```

### System Freezes

```bash
# Limit concurrent operations
datapilot analyze huge.csv \
  --preset low-memory \
  --chunk-size 1000 \
  --max-correlation-pairs 10
```

## Configuration for Large Files

Create a `.datapilotrc` for large file processing:

```json
{
  "performance": {
    "maxRows": 5000000,
    "chunkSize": 5000,
    "memoryThresholdMB": 1024,
    "adaptiveChunkSizing": true
  },
  "streaming": {
    "memoryThresholdMB": 512,
    "maxRowsAnalyzed": 1000000
  },
  "analysis": {
    "maxCorrelationPairs": 25,
    "samplingThreshold": 500000,
    "enableMultivariate": false
  }
}
```

## Best Practices

1. **Start with Overview**: Run section 1 first to understand file structure
2. **Use Sampling**: For initial exploration, use `--sample-size`
3. **Progressive Analysis**: Start with basic sections, add more if needed
4. **Monitor Resources**: Use `--verbose` to track memory usage
5. **Save Results**: Always use `--output` to save results for large files