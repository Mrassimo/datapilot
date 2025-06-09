# DataPilot 🚁📊

[![npm version](https://img.shields.io/npm/v/@datapilot/cli.svg)](https://www.npmjs.com/package/@datapilot/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@datapilot/cli.svg)](https://nodejs.org)
[![Platform Support](https://img.shields.io/badge/platform-windows%20%7C%20macos%20%7C%20linux-blue)](https://nodejs.org)

> **Enterprise-grade streaming CSV analysis with comprehensive statistical insights**

DataPilot does the maths, so AI (or you) can derive the meaning. Get deep insights from your CSV data with a single command.

## ✨ Features

- 🔍 **6-Section Analysis Pipeline**: From basic overview to advanced modeling recommendations
- 🚀 **Streaming Processing**: Handle datasets of any size with constant memory usage
- 📊 **Comprehensive Reports**: Detailed markdown reports with actionable insights
- ♿ **Accessibility-First**: WCAG 2.1 AA compliant visualization recommendations
- 🎯 **Multiple Output Formats**: Markdown, JSON, YAML, and plain text
- ⚡ **High Performance**: Optimized for speed with intelligent caching
- 🌍 **Cross-Platform**: Full support for Windows, macOS, and Linux
- 🔒 **Enterprise Ready**: Proxy support, configurable for corporate environments
- 📦 **Zero Runtime Dependencies**: Only one production dependency (commander)
- 🧪 **Extensive Testing**: 90%+ test coverage with real-world datasets

## 🚀 Installation

### Standard Installation

```bash
# Using npm (recommended)
npm install -g @datapilot/cli

# Using yarn
yarn global add @datapilot/cli

# Using npx (no installation)
npx @datapilot/cli analyze data.csv
```

### Windows Installation

```powershell
# For Windows users, run as Administrator if needed
npm install -g @datapilot/cli

# If 'datapilot' command is not found, use:
npx @datapilot/cli analyze data.csv

# Or add npm global bin to PATH:
# Control Panel → System → Advanced → Environment Variables
# Add to PATH: %APPDATA%\npm
```

### Corporate/Proxy Installation

```bash
# For HTTP proxy
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080
npm install -g @datapilot/cli

# For authenticated proxy
npm config set proxy http://username:password@proxy.company.com:8080
npm config set https-proxy http://username:password@proxy.company.com:8080

# Using environment variables (Unix/macOS/Linux)
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
npm install -g @datapilot/cli

# Using environment variables (Windows)
set HTTP_PROXY=http://proxy.company.com:8080
set HTTPS_PROXY=http://proxy.company.com:8080
npm install -g @datapilot/cli
```

### Docker Installation (Coming Soon)

```bash
# Run without installation
docker run --rm -v $(pwd):/data datapilot/cli analyze /data/file.csv
```

## 📋 Quick Start

### Basic Usage

```bash
# Analyze with all sections (comprehensive analysis)
datapilot analyze data.csv

# Run specific sections
datapilot analyze data.csv --sections 1,2,3

# Different output formats
datapilot analyze data.csv --format json
datapilot analyze data.csv --format yaml
datapilot analyze data.csv --format markdown --output report.md

# Memory-efficient mode for large files
datapilot analyze large-file.csv --preset low-memory

# Silent mode for CI/CD pipelines
datapilot analyze data.csv --quiet --format json > results.json
```

### Configuration File

Create a `.datapilotrc` file in your project root:

```json
{
  "defaultSections": [1, 2, 3],
  "outputFormat": "markdown",
  "performance": {
    "maxRows": 1000000,
    "memoryThresholdMB": 512
  },
  "quiet": false,
  "verbose": true
}
```

## 📊 Analysis Sections

### Section 1: Overview 🗂️
**File metadata, parsing detection, structural analysis**
- File characteristics (size, encoding, BOM detection)
- Column type detection with confidence scores
- Data profiling and sparsity analysis
- UTF-8 BOM handling for Excel exports

### Section 2: Data Quality 🧐
**Comprehensive data quality audit**
- 10 Quality Dimensions assessment
- Composite Quality Score (0-100)
- Missing data patterns and correlations
- Duplicate detection (exact and fuzzy)
- Business rule validation

### Section 3: Exploratory Data Analysis 📈
**Streaming statistical computation**
- Univariate and bivariate analysis
- Distribution testing and outlier detection
- Correlation analysis (Pearson, Spearman, Cramér's V)
- Hypothesis testing with corrections
- Memory-efficient streaming algorithms

### Section 4: Visualization Intelligence 📊
**Accessibility-first chart recommendations**
- Smart chart selection based on data types
- WCAG 2.1 AA compliant color schemes
- Performance-based rendering strategies
- Library-specific code generation
- Responsive design recommendations

### Section 5: Data Engineering 🏗️
**Schema optimization and ML preparation**
- Database schema generation (PostgreSQL, MySQL, SQLite)
- Feature engineering suggestions
- Data type optimization
- Indexing strategies
- ML pipeline preparation

### Section 6: Predictive Modeling 🧠
**Algorithm selection and modeling strategy**
- Automatic task type identification
- Algorithm recommendations with rationale
- Cross-validation strategies
- Performance metrics selection
- Deployment considerations

## 🛠️ Advanced Usage

### Working with Large Files

```bash
# Streaming mode (default for files > 100MB)
datapilot analyze huge-dataset.csv --streaming

# Adjust memory limits
datapilot analyze data.csv --memory-limit 1024

# Sample analysis for quick insights
datapilot analyze data.csv --sample-size 10000
```

### Programmatic Usage

```javascript
const { analyze } = require('@datapilot/cli/api');

// Async analysis
const results = await analyze('data.csv', {
  sections: [1, 2, 3],
  format: 'json',
  streaming: true
});

console.log(results.overview.structuralDimensions);
console.log(results.quality.compositeScore);
```

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Analyze Data Quality
  run: |
    npm install -g @datapilot/cli
    datapilot analyze data.csv --sections 2 --format json > quality.json
    
    # Check quality score
    score=$(jq '.quality.compositeScore' quality.json)
    if (( $(echo "$score < 80" | bc -l) )); then
      echo "Data quality score too low: $score"
      exit 1
    fi
```

## 🔧 Troubleshooting

### Common Issues

**Command not found after installation:**
```bash
# Check npm global bin path
npm bin -g

# Add to PATH (Unix/macOS/Linux)
export PATH="$(npm bin -g):$PATH"

# Use npx as fallback
npx @datapilot/cli analyze data.csv
```

**Memory issues with large files:**
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" datapilot analyze large.csv

# Use streaming mode
datapilot analyze large.csv --preset low-memory
```

**Proxy/firewall issues:**
```bash
# Verify proxy settings
npm config get proxy
npm config get https-proxy

# Bypass proxy for local npm registry
npm config set noproxy "localhost,127.0.0.1,your-internal-domain.com"
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=datapilot:* datapilot analyze data.csv

# Verbose output
datapilot analyze data.csv --verbose

# Save debug log
datapilot analyze data.csv --verbose 2> debug.log
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone and install
git clone https://github.com/Mrassimo/datapilot.git
cd datapilot
npm install

# Run tests
npm test
npm run test:coverage

# Build
npm run build

# Link for local testing
npm link
datapilot analyze test-datasets/sample.csv
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with TypeScript and Node.js
- Statistical algorithms optimized for streaming
- Accessibility guidelines from WCAG 2.1
- Community feedback and contributions

## 📞 Support

- 📖 [Documentation](https://github.com/Mrassimo/datapilot/wiki)
- 🐛 [Issue Tracker](https://github.com/Mrassimo/datapilot/issues)
- 💬 [Discussions](https://github.com/Mrassimo/datapilot/discussions)
- 📧 Email: support@datapilot.dev

---

**DataPilot** - Making data analysis accessible, comprehensive, and actionable. 🚁📊