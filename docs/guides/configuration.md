# DataPilot Configuration Guide

## Configuration File

DataPilot supports configuration through `.datapilotrc` files. The tool looks for configuration in the following order:

1. Command-line arguments (highest priority)
2. `.datapilotrc` in current directory
3. `.datapilotrc` in home directory
4. Default configuration

## Configuration Format

Configuration files can be in JSON or YAML format.

### JSON Example (.datapilotrc)
```json
{
  "defaultSections": [1, 2, 3],
  "outputFormat": "markdown",
  "verbose": false,
  "quiet": false,
  
  "performance": {
    "maxRows": 1000000,
    "chunkSize": 10000,
    "memoryThresholdMB": 1024,
    "maxFieldSize": 1048576,
    "sampleSize": 65536
  },
  
  "streaming": {
    "memoryThresholdMB": 512,
    "maxRowsAnalyzed": 500000,
    "adaptiveChunkSizing": true
  },
  
  "analysis": {
    "maxCategoricalLevels": 100,
    "maxCorrelationPairs": 50,
    "samplingThreshold": 100000,
    "enableMultivariate": true
  },
  
  "quality": {
    "duplicateThresholds": {
      "exact": 0.01,
      "fuzzy": 0.05
    }
  }
}
```

### Environment-Specific Configuration

```json
{
  "environments": {
    "production": {
      "performance": {
        "maxRows": 10000000,
        "memoryThresholdMB": 4096
      },
      "quiet": true
    },
    "development": {
      "verbose": true,
      "performance": {
        "maxRows": 100000
      }
    }
  }
}
```

## Presets

DataPilot includes built-in presets for common scenarios:

### low-memory
```json
{
  "performance": {
    "maxRows": 100000,
    "memoryThresholdMB": 256
  },
  "streaming": {
    "memoryThresholdMB": 128,
    "maxRowsAnalyzed": 50000
  }
}
```

### high-performance
```json
{
  "performance": {
    "maxRows": 10000000,
    "memoryThresholdMB": 4096,
    "adaptiveChunkSizing": true
  }
}
```

### minimal-analysis
```json
{
  "analysis": {
    "enableMultivariate": false
  },
  "defaultSections": [1, 2]
}
```

### ci-cd
```json
{
  "quiet": true,
  "outputFormat": "json",
  "performance": {
    "maxRows": 1000000
  }
}
```

## Configuration Options

### Core Options
- `defaultSections`: Array of section numbers to run by default
- `outputFormat`: Default output format (markdown, json, yaml)
- `verbose`: Enable verbose logging
- `quiet`: Suppress progress output

### Performance Options
- `maxRows`: Maximum rows to process
- `chunkSize`: Rows processed per chunk
- `memoryThresholdMB`: Memory limit in MB
- `maxFieldSize`: Maximum field size in bytes
- `sampleSize`: Sample size for format detection

### Streaming Options
- `memoryThresholdMB`: Memory threshold for streaming mode
- `maxRowsAnalyzed`: Maximum rows for statistical analysis
- `adaptiveChunkSizing`: Enable adaptive chunk sizing

### Analysis Options
- `maxCategoricalLevels`: Maximum unique values for categorical
- `maxCorrelationPairs`: Maximum correlation pairs to compute
- `samplingThreshold`: Row threshold for sampling
- `enableMultivariate`: Enable multivariate analysis

## Command-Line Override

Any configuration option can be overridden via command line:

```bash
# Override max rows
datapilot analyze data.csv --max-rows 50000

# Override memory threshold
datapilot analyze data.csv --memory-threshold 2048

# Use a preset
datapilot analyze data.csv --preset low-memory
```

## Proxy Configuration

For corporate environments, configure proxy settings:

```bash
# npm proxy configuration
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Environment variables
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
```