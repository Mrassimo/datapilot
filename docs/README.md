# DataPilot Documentation

Welcome to the complete DataPilot documentation. This guide provides comprehensive information for users at all levels.

## Quick Navigation

### Getting Started
- [Installation Guide](INSTALLATION.md) - Complete installation instructions for all platforms
- [Configuration Guide](CONFIGURATION.md) - Advanced configuration options and performance tuning
- [Troubleshooting](TROUBLESHOOTING.md) - Solutions to common issues and debugging tips

### Advanced Features
- [Enterprise Installation](ENTERPRISE_INSTALLATION.md) - Offline installation and enterprise deployment
- [Windows Installation](WINDOWS_INSTALL.md) - Detailed Windows-specific installation instructions
- [Production Readiness](PRODUCTION_READINESS.md) - Production deployment considerations
- [Security Review](SECURITY_REVIEW.md) - Security features and best practices

### Development
- [CLI Integration](cli-integration.md) - API integration and programmatic usage
- [Dependency Graph System](dependency-graph-system.md) - Architecture and dependency management

## Command Reference

### Basic Commands
```bash
# Complete analysis
datapilot all data.csv              # Analyze all sections
datapilot info data.csv             # File information only
datapilot validate data.csv         # Format validation

# Individual sections
datapilot overview data.csv         # Section 1: Metadata & structure
datapilot quality data.csv          # Section 2: Data quality assessment
datapilot eda data.csv              # Section 3: Statistical analysis
datapilot visualization data.csv    # Section 4: Chart recommendations
datapilot engineering data.csv      # Section 5: ML engineering insights
datapilot modeling data.csv         # Section 6: Predictive modeling
```

### Multi-File Analysis
```bash
# Relationship detection
datapilot join customers.csv orders.csv        # Analyze relationships
datapilot engineering customers.csv orders.csv # Engineering + joins
datapilot discover /path/to/directory/         # Auto-discover all files

# Interactive wizards
datapilot join-wizard *.csv                   # Step-by-step join wizard
datapilot optimize-joins *.csv                # Performance optimization
```

### Advanced Options
```bash
# Format control
datapilot all data.xlsx --sheet "Sheet1"      # Excel specific sheet
datapilot all data.json --flatten-objects     # JSON object flattening
datapilot all data.txt --format csv           # Force format detection

# Output control
datapilot all data.csv --format json          # JSON output
datapilot all data.csv --format yaml          # YAML output
datapilot all data.csv --output report.md     # Custom output file
datapilot all data.csv --quiet                # Suppress progress

# Performance tuning
datapilot all data.csv --chunk-size 50000     # Custom chunk size
datapilot all data.csv --memory-limit 2gb     # Memory limit
datapilot all data.csv --verbose              # Detailed logging
datapilot all data.csv --progress             # Progress monitoring
```

## Analysis Pipeline

DataPilot uses a 6-section analysis pipeline:

### Section 1: Overview
- File metadata and structure analysis
- Encoding detection and header analysis
- Data type inference and sample preview
- Performance characteristics assessment

### Section 2: Quality
- Missing data patterns and completeness scoring
- Outlier detection using statistical methods
- Data consistency and integrity validation
- Duplicate detection and uniqueness analysis

### Section 3: EDA (Exploratory Data Analysis)
- Univariate statistical analysis (mean, median, mode, std dev)
- Bivariate correlation analysis and relationships
- Distribution analysis and normality testing
- Hypothesis testing and statistical significance

### Section 4: Visualization
- Optimal chart type recommendations
- Aesthetic optimization for readability
- WCAG accessibility compliance
- Dashboard layout suggestions

### Section 5: Engineering
- Schema optimization and indexing recommendations
- Feature engineering suggestions for ML
- Multi-file relationship detection and join analysis
- SQL generation for discovered relationships

### Section 6: Modeling
- Intelligent algorithm selection based on data characteristics
- Bias detection and ethical AI considerations
- Model validation strategies
- Deployment recommendations

## Supported File Formats

| Format | Extensions | Features | Limitations |
|--------|------------|----------|-------------|
| **CSV** | `.csv` | Custom delimiters, quotes, encoding detection | None |
| **TSV** | `.tsv`, `.tab` | Tab-separated values, inconsistency detection | None |
| **JSON** | `.json`, `.jsonl`, `.ndjson` | Nested objects, arrays, JSON Lines | Large nested structures may impact performance |
| **Excel** | `.xlsx`, `.xls`, `.xlsm` | Multiple sheets, cell formatting, formulas | Requires sufficient memory for large files |
| **Parquet** | `.parquet` | Columnar storage, metadata preservation | Requires parquet-compatible environment |

## Performance Characteristics

### Memory Usage
- **Streaming processing**: Constant memory usage regardless of file size
- **Memory efficiency**: Typically uses <512MB RAM for files up to 100GB
- **Configurable limits**: Adjustable memory limits and chunk sizes

### Processing Speed
- **CSV files**: 500K-2M rows/minute depending on complexity
- **JSON files**: 200K-1M records/minute depending on nesting
- **Excel files**: 100K-500K rows/minute depending on sheet complexity
- **Multi-file analysis**: Additional 20-50% overhead for relationship detection

### Scalability
- **Single files**: Up to 100GB tested in production
- **Multi-file analysis**: Up to 50 files simultaneously
- **Directory discovery**: Handles directories with 1000+ files

## LLM Integration

DataPilot outputs are optimized for Large Language Model consumption:

```bash
# Generate JSON for LLM processing
datapilot all data.csv --format json --quiet > analysis.json

# Multi-file analysis for AI insights
datapilot engineering *.csv --format json > relationships.json
```

### Recommended LLM Prompts
```
Analyze this DataPilot report and provide:
1. Top 3 most significant insights
2. Data quality issues that need attention
3. Recommended next steps for analysis
4. Business actions based on findings
5. Join opportunities for business intelligence

[Paste DataPilot JSON output here]
```

## Configuration Management

### Configuration Files
- **Global config**: `~/.datapilotrc`
- **Project config**: `./.datapilotrc`
- **Environment variables**: `DATAPILOT_*` prefix

### Configuration Precedence
1. Command-line arguments (highest priority)
2. Environment variables
3. Project configuration files
4. Global configuration files
5. Default values (lowest priority)

## Best Practices

### For Performance
- Use appropriate chunk sizes for your system's memory
- Enable progress monitoring for large files
- Consider using parallel processing for multi-file analysis
- Monitor memory usage with `--verbose` flag

### For Accuracy
- Validate file formats before analysis
- Use appropriate confidence thresholds for joins
- Review data quality scores before proceeding with analysis
- Consider domain-specific business rules

### For Production
- Implement proper error handling
- Use audit logging for compliance
- Consider security implications of file access
- Test with representative data samples

## Support Resources

- **GitHub Issues**: [Report bugs and request features](https://github.com/Mrassimo/datapilot/issues)
- **Discussions**: [Community support and questions](https://github.com/Mrassimo/datapilot/discussions)
- **Documentation**: This comprehensive guide
- **Examples**: See `/examples/` directory for sample outputs

## License

DataPilot is released under the MIT License. See [LICENSE](../LICENSE) for details.