# DataPilot Usage Examples

## Basic Usage

### Analyse a CSV file with all sections
```bash
datapilot all data.csv
```

### Run specific sections only
```bash
# Section 1: Overview only
datapilot overview data.csv

# Section 2: Quality analysis
datapilot quality data.csv

# Section 3: EDA analysis
datapilot eda data.csv

# Section 4: Visualization recommendations
datapilot visualization data.csv

# Section 5: Engineering insights
datapilot engineering data.csv

# Section 6: Modeling guidance
datapilot modeling data.csv
```

## Output Formats

### Markdown (default)
```bash
datapilot all data.csv -o markdown
```

### JSON output
```bash
datapilot all data.csv -o json
```

### YAML output
```bash
datapilot all data.csv -o yaml
```

### Save to file
```bash
datapilot all data.csv --output-file report.md
datapilot all data.csv -o json --output-file results.json
```

## Performance Options

### Low memory mode for large files
```bash
datapilot all large-dataset.csv --preset low-memory
```

### High performance mode
```bash
datapilot all data.csv --preset high-performance
```

### Custom memory limit
```bash
datapilot all data.csv --max-memory 2048
```

### Sample analysis
```bash
datapilot all huge-file.csv --max-rows 10000
```

## Configuration

### Use custom config file
```bash
datapilot all data.csv --config my-config.json
```

### Override specific settings
```bash
datapilot all data.csv --max-rows 50000 --chunk-size 5000
```

## Quiet and Verbose Modes

### Quiet mode (no progress output)
```bash
datapilot all data.csv --quiet
```

### Verbose mode (detailed logging)
```bash
datapilot all data.csv --verbose
```

### Debug mode
```bash
DEBUG=datapilot:* datapilot all data.csv
```

## Advanced Usage

### Streaming mode for very large files
```bash
datapilot all huge.csv --streaming --max-rows 1000000
```

### CI/CD pipeline example
```bash
# Exit with error if quality score < 80
datapilot quality data.csv -o json --quiet | \
  jq -e '.quality.compositeScore >= 80'
```

### Batch processing
```bash
# Analyse multiple files
for file in *.csv; do
  datapilot all "$file" --output "reports/${file%.csv}_report.md"
done
```

### Docker usage (when available)
```bash
docker run --rm -v $(pwd):/data datapilot/cli all /data/file.csv
```

## Platform-Specific Examples

### Windows PowerShell
```powershell
# Using npx if PATH issues
npx datapilot-cli all data.csv

# With output redirection
datapilot all data.csv --format json | Out-File results.json
```

### Unix/Linux piping
```bash
# Analyse from stdin
cat data.csv | datapilot all -

# Chain with other tools
datapilot all data.csv --format json | jq '.overview.structuralDimensions'
```

## Real-World Scenarios

### Data Quality Gate
```bash
#!/bin/bash
# quality-check.sh
SCORE=$(datapilot quality $1 --format json --quiet | jq '.quality.compositeScore')
if (( $(echo "$SCORE < 80" | bc -l) )); then
  echo "❌ Data quality too low: $SCORE"
  exit 1
fi
echo "✅ Data quality passed: $SCORE"
```

### Automated Reporting
```bash
# Generate daily reports
datapilot all sales_$(date +%Y%m%d).csv \
  --output reports/sales_$(date +%Y%m%d)_analysis.md
```

### Memory-Constrained Environments
```bash
# For systems with limited memory
NODE_OPTIONS="--max-old-space-size=512" datapilot all data.csv \
  --preset low-memory \
  --max-rows 100000
```