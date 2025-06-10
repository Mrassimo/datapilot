# Programmatic API Usage

DataPilot can be used programmatically in Node.js applications, providing access to all six analysis sections including the new advanced modeling capabilities.

## Installation

```bash
npm install datapilot-cli
```

## Basic Usage

```javascript
const { analyze } = require('datapilot-cli/api');

// Analyze a CSV file with all sections
async function analyzeData() {
  try {
    const results = await analyze('data.csv', {
      sections: [1, 2, 3, 4, 5, 6], // All sections including new modeling
      format: 'json'
    });
    
    console.log('Quality Score:', results.quality.compositeScore);
    console.log('Row Count:', results.overview.structuralDimensions.rowCount);
    
    // New Section 6 modeling results
    if (results.modeling) {
      console.log('Recommended Algorithms:', results.modeling.algorithmSelection.selectedAlgorithms);
      console.log('Ethics Risk Level:', results.modeling.ethicsAnalysis.overallRiskLevel);
    }
  } catch (error) {
    console.error('Analysis failed:', error);
  }
}
```

## Section 6: Advanced Modeling API

The new Section 6 provides comprehensive ML guidance through programmatic access:

```javascript
// Access modeling recommendations
const modelingResults = results.modeling;

// Algorithm recommendations
const algorithms = modelingResults.algorithmSelection.selectedAlgorithms;
console.log('Top Algorithm:', algorithms[0].algorithm);
console.log('Confidence Score:', algorithms[0].confidence);
console.log('Rationale:', algorithms[0].rationale);

// Ethics and bias analysis
const ethics = modelingResults.ethicsAnalysis;
console.log('Bias Risk Level:', ethics.biasRisk.overallRiskLevel);
console.log('Sensitive Attributes:', ethics.biasRisk.sensitiveAttributes);
console.log('Mitigation Strategies:', ethics.mitigationStrategies);

// Advanced characterization
const advanced = modelingResults.advancedCharacterization;
console.log('Complexity Score:', advanced.overallComplexityScore);
console.log('Intrinsic Dimensionality:', advanced.intrinsicDimensionality);
console.log('Modeling Challenges:', advanced.modelingChallenges);

// Workflow guidance
const workflow = modelingResults.workflowGuidance;
workflow.steps.forEach((step, index) => {
  console.log(`Step ${index + 1}: ${step.title}`);
  console.log(`Description: ${step.description}`);
  console.log(`Estimated Time: ${step.estimatedTime}`);
});
```

## TypeScript Support

DataPilot v1.2.0 includes comprehensive TypeScript definitions:

```typescript
import { analyze, AnalysisResults, ModelingResults } from 'datapilot-cli/api';

interface AnalysisOptions {
  sections: number[];
  format: 'json' | 'markdown' | 'yaml';
  outputFile?: string;
  verbose?: boolean;
}

async function analyzeWithTypes(filePath: string): Promise<AnalysisResults> {
  const results = await analyze(filePath, {
    sections: [1, 2, 3, 4, 5, 6],
    format: 'json'
  });
  
  // Type-safe access to modeling results
  const modeling: ModelingResults = results.modeling;
  
  return results;
}
```

## Individual Section Analysis

Access specific analysis sections independently:

```javascript
const { analyzers } = require('datapilot-cli/api');

// Section 6: Modeling analysis only
async function getModelingGuidance(filePath) {
  // First need prerequisites (sections 1-3)
  const overview = await analyzers.section1.analyze(filePath);
  const quality = await analyzers.section2.analyze(filePath, { section1Results: overview });
  const eda = await analyzers.section3.analyze(filePath, { section1Results: overview });
  
  // Now run Section 6 modeling
  const modeling = await analyzers.section6.analyze(filePath, {
    section1Results: overview,
    section2Results: quality,
    section3Results: eda
  });
  
  return {
    algorithms: modeling.algorithmSelection,
    ethics: modeling.ethicsAnalysis,
    workflow: modeling.workflowGuidance
  };
}
```

## Configuration API

Programmatically configure analysis parameters:

```javascript
const { ConfigManager } = require('datapilot-cli/core');

// Create custom configuration
const config = ConfigManager.getInstance({
  modeling: {
    maxFeaturesAutoSelection: 50,
    algorithmScoringWeights: {
      performance: 0.5,
      interpretability: 0.3,
      scalability: 0.2
    },
    crossValidation: {
      defaultFolds: 10,
      minSampleSize: 100
    }
  },
  statistical: {
    significanceLevel: 0.01,
    confidenceLevel: 0.99
  }
});

// Use custom config in analysis
const results = await analyze('data.csv', {
  sections: [6],
  config: config.getConfig()
});
```

## Error Handling

Comprehensive error handling for modeling analysis:

```javascript
const { DataPilotError, ErrorSeverity } = require('datapilot-cli/core');

async function robustAnalysis(filePath) {
  try {
    const results = await analyze(filePath, { sections: [1, 2, 3, 4, 5, 6] });
    return results;
  } catch (error) {
    if (error instanceof DataPilotError) {
      switch (error.severity) {
        case ErrorSeverity.CRITICAL:
          console.error('Critical error - analysis cannot continue:', error.message);
          throw error;
        case ErrorSeverity.HIGH:
          console.warn('High severity error:', error.message);
          // Continue with partial analysis
          return await analyze(filePath, { sections: [1, 2, 3] });
        case ErrorSeverity.MEDIUM:
          console.warn('Medium severity warning:', error.message);
          // Return results with warnings
          return error.partialResults;
        default:
          console.log('Minor issue:', error.message);
          return error.partialResults;
      }
    }
    throw error;
  }
}
```

## API Reference

### analyze(filePath, options)

Main analysis function.

**Parameters:**
- `filePath` (string): Path to CSV file
- `options` (object): Analysis options

**Options:**
- `sections` (number[]): Sections to analyze (default: [1,2,3,4,5,6])
- `format` (string): Output format ('json' | 'markdown' | 'yaml')
- `streaming` (boolean): Force streaming mode
- `maxRows` (number): Maximum rows to process
- `quiet` (boolean): Suppress progress output

**Returns:** Promise<AnalysisResult>

### Individual Analyzers

```javascript
const { 
  Section1Analyzer,
  Section2Analyzer,
  StreamingAnalyzer 
} = require('@datapilot/cli/analyzers');

// Use individual analyzers
const overviewAnalyzer = new Section1Analyzer();
const overview = await overviewAnalyzer.analyze('data.csv');

const qualityAnalyzer = new Section2Analyzer();
const quality = await qualityAnalyzer.analyze('data.csv', overview);
```

## Advanced Examples

### Custom Configuration

```javascript
const { analyze, ConfigManager } = require('@datapilot/cli/api');

// Set custom configuration
const config = new ConfigManager();
config.setPerformanceConfig({
  maxRows: 1000000,
  memoryThresholdMB: 2048
});

const results = await analyze('data.csv', {
  config,
  sections: [1, 2, 3]
});
```

### Streaming Large Files

```javascript
const { StreamingAnalyzer } = require('@datapilot/cli/analyzers');
const fs = require('fs');

// Stream processing
const analyzer = new StreamingAnalyzer({
  maxRows: 5000000,
  memoryThresholdMB: 512
});

const stream = fs.createReadStream('huge.csv');
const results = await analyzer.analyzeStream(stream, {
  headers: ['col1', 'col2', 'col3']
});
```

### Progress Monitoring

```javascript
const { analyze } = require('@datapilot/cli/api');
const { ProgressReporter } = require('@datapilot/cli/utils');

// Monitor progress
const progress = new ProgressReporter();

progress.on('progress', (data) => {
  console.log(`${data.phase}: ${data.progress}%`);
});

const results = await analyze('data.csv', {
  progressReporter: progress
});
```

### Error Handling

```javascript
const { analyze, DataPilotError } = require('@datapilot/cli/api');

try {
  const results = await analyze('data.csv');
} catch (error) {
  if (error instanceof DataPilotError) {
    console.error('Analysis error:', error.code);
    console.error('Details:', error.context);
    
    // Handle specific errors
    switch (error.code) {
      case 'EMPTY_FILE':
        console.log('File is empty');
        break;
      case 'INVALID_FORMAT':
        console.log('Invalid CSV format');
        break;
      case 'MEMORY_LIMIT':
        console.log('Memory limit exceeded');
        break;
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Custom Output Formatting

```javascript
const { analyze } = require('@datapilot/cli/api');
const { Section2Formatter } = require('@datapilot/cli/formatters');

// Get raw results
const results = await analyze('data.csv', {
  sections: [2],
  format: 'raw'  // Get unformatted results
});

// Custom formatting
const formatter = new Section2Formatter();
const customReport = formatter.format(results.quality, {
  includeRecommendations: true,
  verbosity: 'detailed'
});
```

### Batch Processing

```javascript
const { analyze } = require('@datapilot/cli/api');
const glob = require('glob');
const path = require('path');

async function batchAnalyze(pattern) {
  const files = glob.sync(pattern);
  const results = [];
  
  for (const file of files) {
    console.log(`Analyzing ${file}...`);
    
    try {
      const result = await analyze(file, {
        sections: [1, 2],
        format: 'json'
      });
      
      results.push({
        file: path.basename(file),
        qualityScore: result.quality.compositeScore,
        rowCount: result.overview.structuralDimensions.rowCount
      });
    } catch (error) {
      results.push({
        file: path.basename(file),
        error: error.message
      });
    }
  }
  
  return results;
}

// Usage
const summary = await batchAnalyze('data/*.csv');
console.table(summary);
```

## Type Definitions

```typescript
interface AnalysisOptions {
  sections?: number[];
  format?: 'json' | 'markdown' | 'yaml' | 'raw';
  streaming?: boolean;
  maxRows?: number;
  memoryThresholdMB?: number;
  quiet?: boolean;
  config?: ConfigManager;
  progressReporter?: ProgressReporter;
}

interface AnalysisResult {
  overview?: Section1Result;
  quality?: Section2Result;
  eda?: Section3Result;
  visualization?: Section4Result;
  engineering?: Section5Result;
  modeling?: Section6Result;
  warnings: Warning[];
  performanceMetrics: PerformanceMetrics;
}
```