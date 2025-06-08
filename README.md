# DataPilot 🚁📊

[![Version](https://img.shields.io/badge/version-0.1.0-blue)](package.json)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-green)](package.json#L34)
[![TypeScript](https://img.shields.io/badge/typescript-5.3.3-blue)](package.json)
[![License](https://img.shields.io/badge/license-MIT-green)](package.json#L32)

> **A lightweight CLI statistical computation engine for comprehensive CSV data analysis**

DataPilot does the maths, so AI (or you) can derive the meaning. Get deep insights from your CSV data with a single command.

## ✨ Features

- 🔍 **6-Section Analysis Pipeline**: From basic overview to advanced modeling recommendations
- 🚀 **Streaming Processing**: Handle datasets of any size with constant memory usage
- 📊 **Comprehensive Reports**: Detailed markdown reports with actionable insights
- ♿ **Accessibility-First**: WCAG 2.1 AA compliant visualization recommendations
- 🎯 **Multiple Output Formats**: Markdown, JSON, YAML, and plain text
- ⚡ **High Performance**: Optimized for speed with intelligent caching
- 🧪 **Extensive Testing**: 90%+ test coverage with real-world datasets

## 🚀 Quick Start

### Installation

```bash
npm install -g datapilot
```

### Basic Usage

```bash
# Comprehensive analysis (all sections)
datapilot all your-data.csv

# Individual section analysis
datapilot overview your-data.csv      # File structure & metadata
datapilot quality your-data.csv       # Data quality audit
datapilot eda your-data.csv          # Exploratory data analysis
datapilot visualization your-data.csv # Chart recommendations
datapilot engineering your-data.csv  # Schema & ML preparation
datapilot modeling your-data.csv     # Predictive modeling guidance
```

### Output Options

```bash
# Different output formats
datapilot all data.csv --output json
datapilot all data.csv --output yaml
datapilot all data.csv --output markdown  # Default

# Custom output file
datapilot all data.csv --output-file my-analysis.md

# Quiet mode
datapilot all data.csv --quiet
```

## 📋 Analysis Sections

### Section 1: Overview 🗂️
**File metadata, parsing detection, structural analysis**
- File characteristics (size, encoding, structure)
- Column type detection and confidence scores
- Data profiling and sparsity analysis
- Environment and system information

### Section 2: Data Quality 🧐
**Comprehensive data quality audit**
- **10 Quality Dimensions**: Completeness, accuracy, consistency, uniqueness, validity, timeliness, integrity, reasonableness, precision, representational
- **Composite Quality Score**: Weighted assessment across all dimensions
- **Missing Data Analysis**: Patterns, correlations, imputation strategies
- **Duplicate Detection**: Exact and fuzzy/semantic duplicates
- **Business Rule Validation**: Cross-field consistency checks

### Section 3: Exploratory Data Analysis 📈
**Streaming statistical computation**
- **Univariate Analysis**: Distributions, normality tests, outlier detection
- **Bivariate Analysis**: Correlations, relationships, dependency analysis
- **Multivariate Analysis**: PCA, clustering, advanced pattern detection
- **Statistical Tests**: Hypothesis testing with multiple correction methods
- **Performance Optimized**: Handles millions of rows efficiently

### Section 4: Visualization Intelligence 📊
**Accessibility-first chart recommendations**
- **Smart Chart Selection**: Data-driven recommendations with confidence scores
- **Aesthetic Optimization**: Color palettes, typography, layout principles
- **Accessibility Features**: WCAG 2.1 AA compliance, colorblind-friendly
- **Library Recommendations**: d3.js, Plotly, Observable Plot suggestions
- **Performance Considerations**: Rendering strategies for different data sizes

### Section 5: Data Engineering 🏗️
**Schema optimization and ML preparation**
- **Database Schema Design**: Optimized for PostgreSQL, MySQL, others
- **Feature Engineering**: Automated suggestions for ML pipelines
- **Data Type Optimization**: Memory and storage efficiency recommendations
- **ML Readiness Assessment**: Pipeline preparation and data transformation guides

### Section 6: Predictive Modeling 🧠
**Algorithm selection and modeling strategy**
- **Task Identification**: Regression, classification, clustering, time series
- **Algorithm Recommendations**: Scikit-learn, TensorFlow, PyTorch suggestions
- **Model Validation**: Cross-validation strategies and performance metrics
- **Ethics & Bias Assessment**: Fairness analysis and bias detection
- **Deployment Strategy**: Production readiness and monitoring recommendations

## 🛠️ Development

### Prerequisites

- Node.js ≥ 18.0.0
- npm or yarn

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd datapilot

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

### Development Commands

```bash
npm run build          # Compile TypeScript to dist/
npm run dev            # Watch mode compilation  
npm run test           # Run all tests
npm run test:coverage  # Generate coverage report (90% threshold)
npm run lint           # ESLint checking
npm run lint:fix       # Auto-fix linting issues
npm run typecheck      # Type checking without emitting files
npm run clean          # Remove dist directory
```

### Project Structure

```
src/
├── analyzers/          # Analysis engines for each section
│   ├── overview/       # Section 1: File & structure analysis
│   ├── quality/        # Section 2: Data quality assessment
│   ├── streaming/      # Section 3: EDA & statistical analysis
│   ├── visualization/  # Section 4: Chart recommendations
│   ├── engineering/    # Section 5: Schema & ML preparation
│   └── modeling/       # Section 6: Predictive modeling guidance
├── cli/               # Command-line interface
├── core/              # Core utilities and configuration
├── parsers/           # CSV parsing and detection
└── utils/             # Shared utilities and helpers

test-datasets/         # Sample datasets for testing
examples/              # Example outputs and usage
tests/                 # Comprehensive test suite
```

## 📖 Examples

### Sample Output

DataPilot generates comprehensive reports like this:

```markdown
### Section 2: Comprehensive Data Quality & Integrity Audit Report 🧐🛡️

**2.1. Overall Data Quality Cockpit:**
* **Composite Data Quality Score (CDQS):** 92.3 / 100
* **Top Data Quality Strengths:**
  1. Excellent completeness with 99.38% score (completeness)
  2. Excellent uniqueness with 100% score (uniqueness)
* **Areas for Improvement:**
  1. Precision quality needs attention (0% score)
```

### Real-World Datasets

DataPilot has been tested with:
- **Student Performance Data**: Academic metrics and lifestyle factors
- **Medical Datasets**: Patient records and clinical data
- **Air Quality Data**: Environmental monitoring across cities
- **Financial Transactions**: Large-scale transaction logs
- **Flight Data**: Aviation industry datasets

## 🧪 Testing

DataPilot includes extensive testing across multiple dimensions:

- **Unit Tests**: Individual component validation
- **Integration Tests**: Cross-section data flow
- **Performance Tests**: Large dataset handling
- **Real-World Tests**: Actual datasets from Kaggle and industry sources

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --testPathPattern="section1"
npm test -- --testPathPattern="quality"
npm test -- --testPathPattern="streaming"

# Generate coverage report
npm run test:coverage
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- TypeScript with strict mode enabled
- ESLint + Prettier for formatting
- Comprehensive JSDoc documentation
- 90%+ test coverage requirement

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with TypeScript and Node.js
- Statistical computations optimized for streaming processing
- Accessibility guidelines following WCAG 2.1 AA standards
- Visualization recommendations based on statistical best practices

---

**DataPilot** - Making data analysis accessible, comprehensive, and actionable. 🚁📊