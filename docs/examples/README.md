# DataPilot Output Examples

This directory contains example outputs from DataPilot commands for various datasets.

## Files

### Insurance Dataset Analysis
- `insurance_RUN.txt` - Complete analysis output from `datapilot all insurance.csv`
- `insurance_analysis.txt` - Analysis results

### Iris Dataset Analysis  
- `iris_RUN.txt` - Complete analysis output from `datapilot all iris.csv`
- `iris_SUM.txt` - Summary analysis from `datapilot sum iris.csv`

### Large Test Dataset Analysis
- `large_test_RUN.txt` - Complete analysis output from `datapilot all large_test.csv`
- `large_test_SUM.txt` - Summary analysis from `datapilot sum large_test.csv`

### Melbourne Housing Dataset Analysis
- `melbourne_housing_RUN.txt` - Complete analysis output from `datapilot all melbourne_housing.csv`
- `melbourne_housing_SUM.txt` - Summary analysis from `datapilot sum melbourne_housing.csv`

## Usage

These files demonstrate the comprehensive output format that DataPilot generates for different types of datasets:

- **Insurance data**: Healthcare/insurance domain with numerical and categorical features
- **Iris data**: Classic ML dataset with numerical features and species classification
- **Large test data**: Performance testing with 10K+ rows
- **Melbourne housing**: Real estate data with geographical and price information

Each `*_RUN.txt` file shows the complete analysis pipeline output, while `*_SUM.txt` files show the condensed summary format suitable for LLM consumption.