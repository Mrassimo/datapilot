# Programmatic API Usage

DataPilot can be used programmatically in Node.js applications.

## Installation

```bash
npm install @datapilot/cli
```

## Basic Usage

```javascript
const { analyze } = require('@datapilot/cli/api');

// Analyze a CSV file
async function analyzeData() {
  try {
    const results = await analyze('data.csv', {
      sections: [1, 2, 3],
      format: 'json'
    });
    
    console.log('Quality Score:', results.quality.compositeScore);
    console.log('Row Count:', results.overview.structuralDimensions.rowCount);
  } catch (error) {
    console.error('Analysis failed:', error);
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