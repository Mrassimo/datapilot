# DataPilot Configuration Guide

This guide covers all configuration options for optimising DataPilot performance and customising analysis behaviour.

## Configuration Overview

DataPilot supports multiple configuration layers with the following precedence (highest to lowest):

1. **Command-line arguments** (highest priority)
2. **Environment variables**
3. **Project configuration files** (`.datapilotrc`)
4. **Global configuration files** (`~/.datapilotrc`)
5. **Default values** (lowest priority)

## Configuration Files

### Location and Format

Configuration files use YAML format and can be placed in:

- **Project level**: `./.datapilotrc`
- **User level**: `~/.datapilotrc`
- **System level**: `/etc/datapilot/datapilotrc` (Linux/macOS)

### Basic Configuration File

```yaml
# .datapilotrc
performance:
  chunkSize: 10000
  memoryLimit: "512mb"
  parallelProcessing: true
  threads: 4

analysis:
  sections: [1, 2, 3, 4, 5, 6]
  confidenceLevel: 0.95
  joinConfidenceThreshold: 0.5
  enableAdvancedStats: true

output:
  format: "markdown"
  includeRawData: false
  verboseLogging: false
  quiet: false

files:
  autoDetectFormat: true
  encoding: "auto"
  maxFileSize: "10gb"
```

## Performance Configuration

### Memory Management

```yaml
performance:
  # Memory limit for processing
  memoryLimit: "512mb"      # Options: "256mb", "512mb", "1gb", "2gb", "4gb"
  
  # Chunk size for streaming processing
  chunkSize: 10000          # Rows per chunk: 1000-100000
  
  # Enable garbage collection optimisation
  gcOptimization: true
  
  # Memory usage monitoring
  memoryMonitoring: true
  
  # Emergency memory cleanup threshold
  memoryCleanupThreshold: 0.8
```

### Processing Performance

```yaml
performance:
  # Enable parallel processing
  parallelProcessing: true
  
  # Number of worker threads (0 = auto-detect)
  threads: 0
  
  # Enable adaptive chunking based on system performance
  adaptiveChunking: true
  
  # Cache frequently accessed data
  enableCaching: true
  
  # Cache size limit
  cacheSize: "100mb"
```

### Performance Presets

```yaml
# Use predefined performance presets
preset: "high-performance"  # Options: "low-memory", "balanced", "high-performance", "enterprise"

# Or customise individual settings
performance:
  preset: "custom"
  chunkSize: 50000
  memoryLimit: "2gb"
  threads: 8
  parallelProcessing: true
```

**Preset Details:**

| Preset | Memory Limit | Chunk Size | Workers | Use Case |
|--------|-------------|------------|---------|----------|
| `low-memory` | 256MB | 5,000 | 2 | Resource-constrained environments |
| `balanced` | 512MB | 10,000 | 4 | Default, general purpose |
| `high-performance` | 2GB | 50,000 | 8 | High-end workstations |
| `enterprise` | 4GB | 100,000 | 16 | Server deployments |

## Analysis Configuration

### Section Control

```yaml
analysis:
  # Enable/disable specific analysis sections
  sections: [1, 2, 3, 4, 5, 6]  # All sections
  # sections: [1, 2, 3]         # Only overview, quality, EDA
  
  # Skip sections for faster processing
  skipSections: []              # Skip no sections
  # skipSections: [4, 6]        # Skip visualization and modeling
  
  # Section-specific settings
  sectionConfig:
    quality:
      outlierDetectionMethod: "iqr"  # Options: "iqr", "zscore", "isolation_forest"
      missingDataThreshold: 0.1
    eda:
      maxCorrelationPairs: 1000
      enableHypothesisTesting: true
    engineering:
      maxJoinCandidates: 50
      joinConfidenceThreshold: 0.5
```

### Statistical Settings

```yaml
analysis:
  # Statistical confidence level
  confidenceLevel: 0.95        # Options: 0.90, 0.95, 0.99
  
  # Significance threshold for hypothesis tests
  significanceLevel: 0.05
  
  # Correlation threshold for reporting
  correlationThreshold: 0.3
  
  # Sample size for large datasets
  sampleSize: 100000
  
  # Enable advanced statistical tests
  enableAdvancedStats: true
```

### Multi-File Analysis

```yaml
analysis:
  multiFile:
    # Maximum files to analyse simultaneously
    maxFiles: 50
    
    # Join confidence threshold
    joinConfidenceThreshold: 0.5
    
    # Maximum join combinations to evaluate
    maxJoinCombinations: 1000
    
    # Enable foreign key detection
    enableForeignKeyDetection: true
    
    # SQL generation settings
    sqlGeneration:
      dialect: "standard"      # Options: "standard", "mysql", "postgresql", "sqlite"
      optimiseQueries: true
```

## File Format Configuration

### CSV Configuration

```yaml
formats:
  csv:
    # Auto-detect delimiter
    autoDetectDelimiter: true
    
    # Default delimiter if auto-detection fails
    delimiter: ","
    
    # Quote character
    quote: "\""
    
    # Escape character
    escape: "\\"
    
    # Skip empty lines
    skipEmptyLines: true
    
    # Header detection
    hasHeader: "auto"          # Options: true, false, "auto"
    
    # Encoding detection
    encoding: "auto"           # Options: "auto", "utf8", "latin1", "ascii"
```

### JSON Configuration

```yaml
formats:
  json:
    # Flatten nested objects
    flattenObjects: false
    
    # Maximum nesting depth
    maxDepth: 10
    
    # Handle JSON Lines format
    jsonLines: "auto"          # Options: true, false, "auto"
    
    # Array handling
    arrayHandling: "expand"    # Options: "expand", "serialize", "ignore"
```

### Excel Configuration

```yaml
formats:
  excel:
    # Default sheet to analyse
    defaultSheet: 0            # Sheet index or name
    
    # Analyse all sheets
    analyseAllSheets: false
    
    # Skip hidden sheets
    skipHiddenSheets: true
    
    # Date format handling
    dateFormat: "auto"
    
    # Formula evaluation
    evaluateFormulas: false
```

## Output Configuration

### Format Options

```yaml
output:
  # Output format
  format: "markdown"          # Options: "markdown", "json", "yaml", "html", "txt"
  
  # Output destination
  destination: "file"         # Options: "file", "stdout", "both"
  
  # Custom output filename pattern
  filenamePattern: "{filename}_datapilot_{section}.{ext}"
  
  # Include raw data in output
  includeRawData: false
  
  # Pretty print JSON/YAML
  prettyPrint: true
```

### Content Control

```yaml
output:
  content:
    # Include section summaries
    includeSummaries: true
    
    # Include detailed statistics
    includeDetailedStats: true
    
    # Include visualisations recommendations
    includeVisualisations: true
    
    # Include SQL queries for joins
    includeSqlQueries: true
    
    # Include confidence scores
    includeConfidenceScores: true
```

### Logging Configuration

```yaml
logging:
  # Log level
  level: "info"              # Options: "debug", "info", "warn", "error"
  
  # Log to file
  logToFile: false
  
  # Log file location
  logFile: "./datapilot.log"
  
  # Verbose output
  verbose: false
  
  # Quiet mode (minimal output)
  quiet: false
  
  # Progress reporting
  showProgress: true
```

## Environment-Specific Configuration

### Development Environment

```yaml
environment: "development"

development:
  performance:
    chunkSize: 5000
    memoryLimit: "256mb"
  
  logging:
    level: "debug"
    verbose: true
  
  output:
    includeRawData: true
```

### Production Environment

```yaml
environment: "production"

production:
  performance:
    chunkSize: 50000
    memoryLimit: "2gb"
    parallelProcessing: true
  
  logging:
    level: "error"
    logToFile: true
    quiet: true
  
  security:
    auditLogging: true
    validateInputs: true
```

### CI/CD Environment

```yaml
environment: "ci"

ci:
  performance:
    chunkSize: 10000
    memoryLimit: "1gb"
  
  output:
    format: "json"
    quiet: true
  
  analysis:
    sections: [1, 2, 3]        # Skip expensive sections
```

## Environment Variables

All configuration options can be set via environment variables using the `DATAPILOT_` prefix:

```bash
# Performance settings
export DATAPILOT_PERFORMANCE_CHUNK_SIZE=20000
export DATAPILOT_PERFORMANCE_MEMORY_LIMIT="1gb"
export DATAPILOT_PERFORMANCE_PARALLEL_PROCESSING=true

# Analysis settings
export DATAPILOT_ANALYSIS_CONFIDENCE_LEVEL=0.99
export DATAPILOT_ANALYSIS_SECTIONS="1,2,3,4,5,6"

# Output settings
export DATAPILOT_OUTPUT_FORMAT="json"
export DATAPILOT_OUTPUT_QUIET=true

# Logging settings
export DATAPILOT_LOGGING_LEVEL="debug"
export DATAPILOT_LOGGING_VERBOSE=true
```

## Command-Line Overrides

Command-line arguments take highest precedence:

```bash
# Override memory limit
datapilot all data.csv --memory-limit 2gb

# Override output format
datapilot all data.csv --format json

# Override chunk size
datapilot all data.csv --chunk-size 50000

# Enable verbose mode
datapilot all data.csv --verbose

# Quiet mode
datapilot all data.csv --quiet

# Custom confidence level
datapilot all data.csv --confidence 0.99
```

## Advanced Configuration

### Custom Algorithms

```yaml
algorithms:
  outlierDetection:
    method: "isolation_forest"
    contamination: 0.1
    
  typeDetection:
    dateFormats: ["YYYY-MM-DD", "MM/DD/YYYY", "DD-MM-YYYY"]
    numericThreshold: 0.8
    
  clustering:
    algorithm: "kmeans"
    maxClusters: 10
```

### Security Configuration

```yaml
security:
  # Enable input validation
  validateInputs: true
  
  # File size limits
  maxFileSize: "10gb"
  
  # Allowed file extensions
  allowedExtensions: [".csv", ".json", ".xlsx", ".tsv", ".parquet"]
  
  # Audit logging
  auditLogging: true
  auditLogFile: "./audit.log"
  
  # Sandbox processing
  sandboxMode: false
```

### Integration Settings

```yaml
integration:
  # API settings for future integrations
  api:
    timeout: 30000
    retryAttempts: 3
  
  # Database connections (future feature)
  database:
    enabled: false
  
  # Cloud storage (future feature)
  cloud:
    enabled: false
```

## Configuration Validation

DataPilot validates configuration on startup:

```bash
# Check DataPilot version and verbose info
datapilot --version --verbose

# Test with minimal configuration
datapilot all data.csv --quiet
```

## Performance Tuning Guide

### For Small Files (<10MB)
```yaml
performance:
  chunkSize: 5000
  memoryLimit: "256mb"
  parallelProcessing: false
```

### For Medium Files (10MB-1GB)
```yaml
performance:
  chunkSize: 10000
  memoryLimit: "512mb"
  parallelProcessing: true
  threads: 4
```

### For Large Files (1GB-10GB)
```yaml
performance:
  chunkSize: 50000
  memoryLimit: "2gb"
  parallelProcessing: true
  threads: 8
  adaptiveChunking: true
```

### For Very Large Files (>10GB)
```yaml
performance:
  chunkSize: 100000
  memoryLimit: "4gb"
  parallelProcessing: true
  threads: 16
  adaptiveChunking: true
  enableCaching: false      # Disable to save memory
```

## Troubleshooting Configuration Issues

### Common Problems

**Configuration not loaded:**
- Check file location and permissions
- Verify YAML syntax with online validator
- Use `datapilot --version --verbose` to check configuration loading

**Performance issues:**
- Reduce `chunkSize` if running out of memory
- Increase `memoryLimit` if processing is slow
- Disable `parallelProcessing` on single-core systems

**Invalid settings:**
- Check data types (strings vs numbers)
- Verify enum values (e.g., output formats)
- Check for typos in configuration keys

## Configuration Examples

### High-Performance Workstation
```yaml
preset: "high-performance"
performance:
  memoryLimit: "4gb"
  chunkSize: 100000
  threads: 16
output:
  format: "json"
  includeDetailedStats: true
```

### Memory-Constrained Environment
```yaml
preset: "low-memory"
performance:
  memoryLimit: "128mb"
  chunkSize: 2000
  parallelProcessing: false
analysis:
  sections: [1, 2, 3]
  enableAdvancedStats: false
```

### CI/CD Pipeline
```yaml
environment: "ci"
output:
  format: "json"
  quiet: true
  destination: "stdout"
logging:
  level: "error"
analysis:
  sections: [1, 2]
```

For more configuration examples, see the `/examples/config/` directory in the repository.