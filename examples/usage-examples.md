# DataPilot Usage Examples

## Basic Usage

### Analyze a CSV file with all sections
```bash
datapilot analyze data.csv
```

### Run specific sections only
```bash
# Section 1: Overview only
datapilot analyze data.csv --sections 1

# Sections 1, 2, and 3
datapilot analyze data.csv --sections 1,2,3

# Quality and EDA sections
datapilot analyze data.csv --sections 2,3
```

## Output Formats

### Markdown (default)
```bash
datapilot analyze data.csv --format markdown
```

### JSON output
```bash
datapilot analyze data.csv --format json
```

### YAML output
```bash
datapilot analyze data.csv --format yaml
```

### Save to file
```bash
datapilot analyze data.csv --output report.md
datapilot analyze data.csv --format json --output results.json
```

## Performance Options

### Low memory mode for large files
```bash
datapilot analyze large-dataset.csv --preset low-memory
```

### High performance mode
```bash
datapilot analyze data.csv --preset high-performance
```

### Custom memory limit
```bash
datapilot analyze data.csv --memory-limit 2048
```

### Sample analysis
```bash
datapilot analyze huge-file.csv --sample-size 10000
```

## Configuration

### Use custom config file
```bash
datapilot analyze data.csv --config my-config.json
```

### Override specific settings
```bash
datapilot analyze data.csv --max-rows 50000 --chunk-size 5000
```

## Quiet and Verbose Modes

### Quiet mode (no progress output)
```bash
datapilot analyze data.csv --quiet
```

### Verbose mode (detailed logging)
```bash
datapilot analyze data.csv --verbose
```

### Debug mode
```bash
DEBUG=datapilot:* datapilot analyze data.csv
```

## Advanced Usage

### Streaming mode for very large files
```bash
datapilot analyze huge.csv --streaming --max-rows 1000000
```

### CI/CD pipeline example
```bash
# Exit with error if quality score < 80
datapilot analyze data.csv --sections 2 --format json --quiet | \
  jq -e '.quality.compositeScore >= 80'
```

### Batch processing
```bash
# Analyze multiple files
for file in *.csv; do
  datapilot analyze "$file" --output "reports/${file%.csv}_report.md"
done
```

### Docker usage (when available)
```bash
docker run --rm -v $(pwd):/data datapilot/cli analyze /data/file.csv
```

## Platform-Specific Examples

### Windows PowerShell
```powershell
# Using npx if PATH issues
npx @datapilot/cli analyze data.csv

# With output redirection
datapilot analyze data.csv --format json | Out-File results.json
```

### Unix/Linux piping
```bash
# Analyze from stdin
cat data.csv | datapilot analyze -

# Chain with other tools
datapilot analyze data.csv --format json | jq '.overview.structuralDimensions'
```

## Real-World Scenarios

### Data Quality Gate
```bash
#!/bin/bash
# quality-check.sh
SCORE=$(datapilot analyze $1 --sections 2 --format json --quiet | jq '.quality.compositeScore')
if (( $(echo "$SCORE < 80" | bc -l) )); then
  echo "❌ Data quality too low: $SCORE"
  exit 1
fi
echo "✅ Data quality passed: $SCORE"
```

### Automated Reporting
```bash
# Generate daily reports
datapilot analyze sales_$(date +%Y%m%d).csv \
  --output reports/sales_$(date +%Y%m%d)_analysis.md \
  --sections 1,2,3
```

### Memory-Constrained Environments
```bash
# For systems with limited memory
NODE_OPTIONS="--max-old-space-size=512" datapilot analyze data.csv \
  --preset low-memory \
  --max-rows 100000
```