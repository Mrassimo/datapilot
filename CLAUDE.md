# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
DataPilot is a lightweight CLI statistical computation engine for comprehensive CSV data analysis. It generates detailed reports covering data quality, exploratory analysis, visualization recommendations, and predictive modeling guidance.

## Development Guidelines
- Write in TypeScript primarily
- Target Node.js (latest LTS version)
- Maintain a lightweight footprint with minimal dependencies
- Focus on accurate statistical computations over complex ML implementations
- Structure output for optimal consumption by LLMs
- Write in British English please

## Architecture
- CLI application with modular design
- Core analysis engines: Quality, EDA, VisRec, EngRec, ModelGuide
- Primary output: Comprehensive Markdown report with 6 sections
- Optional JSON/YAML for knowledge base snippets

## Key Implementation Notes
- Auto-detect CSV encoding, delimiters, headers, line endings
- Prioritise deterministic statistical computations
- Provide visualization recommendations without rendering
- Suggest advanced analyses without implementing complex algorithms
- Cross-platform compatibility (Windows, macOS, Linux)
- Must function offline

## Output Sections
1. Dataset & Analysis Overview - File metadata, CSV parsing, structural dimensions
2. Data Quality & Integrity Audit - Completeness, type conformity, uniqueness, consistency
3. Exploratory Data Analysis - Univariate/bivariate statistics, correlations, distributions
4. Visualization Intelligence - Chart recommendations with summarised data
5. Data Engineering Insights - Schema optimization, transformation recommendations
6. Predictive Modeling Guidance - Algorithm suggestions, methodology explanations

## Commands (To be implemented)
```bash
# Primary command - generates full report
datapilot all <your-data.csv>

# Development commands (when implemented)
npm install       # Install dependencies
npm run build     # Build TypeScript
npm test          # Run tests
npm run lint      # Lint code
npm run typecheck # Type checking
```

## Development Workflow
- push to git after a feature is complete
- make commits after any major task
- leave notes after tasks are complete in CLAUDE.md

## Testing and Verification
- Test and verify outputs using Kaggle datasets in the test-datasets folder (/Users/massimoraso/plum/test-datasets)
- Cross-check outputs against section documents and PRD in /Users/massimoraso/plum/docs/outputs/Prd-docs