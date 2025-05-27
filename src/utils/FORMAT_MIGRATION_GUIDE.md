# DataPilot Output Format Migration Guide

## Overview
This guide helps migrate commands to use the new unified formatting system.

## Before & After Examples

### 1. Section Headers

**Before:**
```javascript
console.log(chalk.yellow('═'.repeat(80)));
console.log(chalk.cyan('DATA INTEGRITY REPORT'));
console.log(chalk.yellow('═'.repeat(80)));
```

**After:**
```javascript
import { createHeader } from '../utils/unifiedFormat.js';
console.log(createHeader('Data Integrity Report', 'Comprehensive analysis results'));
```

### 2. Progress Indicators

**Before:**
```javascript
const spinner = ora('Analyzing data...').start();
spinner.succeed('Analysis complete!');
```

**After:**
```javascript
import { createStandardSpinner } from '../utils/unifiedFormat.js';
const spinner = createStandardSpinner('Analyzing data...');
spinner.start();
spinner.succeed('Analysis complete');
```

### 3. Tables

**Before:**
```javascript
// ASCII art tables with manual formatting
console.log('┌─────────┬─────────┐');
console.log('│ Column  │ Value   │');
```

**After:**
```javascript
import { createTable } from '../utils/unifiedFormat.js';
console.log(createTable(['Column', 'Value'], rows));
```

### 4. Lists

**Before:**
```javascript
items.forEach(item => console.log(`- ${item}`));
```

**After:**
```javascript
import { createList } from '../utils/unifiedFormat.js';
console.log(createList(items));
```

### 5. Numbers & Percentages

**Before:**
```javascript
console.log(`Accuracy: ${(accuracy * 100).toFixed(1)}%`);
```

**After:**
```javascript
import { formatPercent } from '../utils/unifiedFormat.js';
console.log(`Accuracy: ${formatPercent(accuracy)}`);
```

### 6. Success/Error Messages

**Before:**
```javascript
console.log(chalk.green('✓ Operation successful'));
console.log(chalk.red('✗ Operation failed'));
```

**After:**
```javascript
import { createSuccess, createError } from '../utils/unifiedFormat.js';
console.log(createSuccess('Operation successful'));
console.log(createError('Operation failed'));
```

## Migration Steps

1. Import unified formatting utilities
2. Replace chalk color calls with unified colors
3. Replace manual separators with unified lines
4. Replace custom spinners with standardized spinners
5. Replace manual formatting with format functions
6. Test output consistency

## Color Mapping

| Old                | New                      |
|--------------------|--------------------------|
| chalk.yellow()     | colors.warning()         |
| chalk.green()      | colors.success()         |
| chalk.red()        | colors.error()           |
| chalk.cyan()       | colors.primary()         |
| chalk.blue()       | colors.info()            |
| chalk.gray()       | colors.muted()           |
| chalk.bold()       | colors.heading()         |

## Symbol Mapping

| Old    | New               |
|--------|-------------------|
| ✓      | symbols.success   |
| ✗      | symbols.error     |
| ⚠️     | symbols.warning   |
| •      | symbols.bullet    |
| →      | symbols.arrow     |

## Standard Command Pattern

```javascript
import { withStandardFormatting, OutputFormatter } from '../utils/unifiedFormat.js';

export async function myCommand(filePath, options) {
  return withStandardFormatting('My Command', async (spinner) => {
    // Your command logic here
    
    const formatter = new OutputFormatter('My Command');
    formatter
      .addHeader('Analysis Results', 'Generated on ' + new Date().toISOString())
      .addSection('Key Findings', content, symbols.analysis)
      .addTable('Statistics', headers, rows)
      .addSummary('Summary', summaryItems);
    
    console.log(formatter.render());
  });
}
```