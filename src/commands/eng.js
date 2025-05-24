import { parseCSV, detectColumnTypes } from '../utils/parser.js';
import { calculateStats } from '../utils/stats.js';
import { createSection, createSubSection, formatTimestamp, formatFileSize, bulletList, formatNumber } from '../utils/format.js';
import { OutputHandler } from '../utils/output.js';
import { statSync } from 'fs';
import { basename } from 'path';
import ora from 'ora';

export async function engineering(filePath, options = {}) {
  const outputHandler = new OutputHandler(options);
  const spinner = options.quiet ? null : ora('Reading CSV file...').start();
  
  try {
    // Use preloaded data if available
    let records, columnTypes;
    if (options.preloadedData) {
      records = options.preloadedData.records;
      columnTypes = options.preloadedData.columnTypes;
    } else {
      // Parse CSV
      records = await parseCSV(filePath, { quiet: options.quiet });
      if (spinner) spinner.text = 'Analyzing data engineering requirements...';
      columnTypes = detectColumnTypes(records);
    }
    
    const fileName = basename(filePath);
    const fileStats = statSync(filePath);
    const columns = Object.keys(columnTypes);
    
    // Build report
    let report = createSection('DATA ENGINEERING ANALYSIS',
      `Dataset: ${fileName}\nGenerated: ${formatTimestamp()}`);
    
    // Schema Recommendations
    report += createSubSection('SCHEMA RECOMMENDATIONS', '');
    
    report += '\nSuggested Table Structure:\n```sql\n';
    report += '-- Recommended data types based on analysis\n';
    report += `CREATE TABLE ${fileName.replace('.csv', '').toLowerCase().replace(/[^a-z0-9]/g, '_')} (\n`;
    
    const columnDefinitions = [];
    const indexes = [];
    const foreignKeys = [];
    
    columns.forEach(column => {
      const type = columnTypes[column];
      const sqlType = getSQLType(type, records.map(r => r[column]));
      const constraints = getConstraints(column, type, records);
      
      columnDefinitions.push(`    ${column.toLowerCase().replace(/[^a-z0-9]/g, '_')}${sqlType}${constraints}`);
      
      // Identify potential indexes
      if (type.type === 'identifier' || column.toLowerCase().includes('_id')) {
        if (isUniqueColumn(records, column)) {
          indexes.push(`CREATE UNIQUE INDEX idx_${column.toLowerCase()} ON ${fileName.replace('.csv', '')}(${column.toLowerCase()});`);
        } else {
          indexes.push(`CREATE INDEX idx_${column.toLowerCase()} ON ${fileName.replace('.csv', '')}(${column.toLowerCase()});`);
        }
      }
      
      // Identify foreign keys
      if (column.toLowerCase().includes('_id') && !column.toLowerCase().includes('transaction_id') && !column.toLowerCase().includes('order_id')) {
        const referencedTable = column.toLowerCase().replace('_id', '').replace('id_', '');
        foreignKeys.push(`    FOREIGN KEY (${column.toLowerCase()}) REFERENCES ${referencedTable}s(id)`);
      }
    });
    
    report += columnDefinitions.join(',\n');
    if (foreignKeys.length > 0) {
      report += ',\n' + foreignKeys.join(',\n');
    }
    report += '\n);\n\n';
    
    // Add indexes
    if (indexes.length > 0) {
      report += '-- Recommended indexes based on data patterns\n';
      report += indexes.join('\n') + '\n';
    }
    report += '```\n';
    
    // Data Characteristics
    report += createSubSection('DATA CHARACTERISTICS', bulletList([
      `Current format: CSV with ${records.length.toLocaleString()} rows`,
      `Estimated table size: ~${estimateTableSize(records, columnTypes)}`,
      `Growth rate: ${estimateGrowthRate(records, columns, columnTypes)}`,
      `Update frequency: ${estimateUpdateFrequency(records, columns)}`
    ]));
    
    // Normalization Analysis
    const normalizationIssues = analyzeNormalization(records, columns, columnTypes);
    if (normalizationIssues.length > 0) {
      report += createSubSection('NORMALISATION ANALYSIS', 
        `- Current structure suggests ${detectNormalForm(normalizationIssues)}\n` +
        '- Denormalisation opportunities:\n' +
        normalizationIssues.map(issue => `  * ${issue}`).join('\n')
      );
    }
    
    // Data Quality for ETL
    const qualityIssues = analyzeDataQuality(records, columnTypes);
    report += createSubSection('DATA QUALITY FOR ETL', bulletList([
      `Clean records: ${formatNumber((1 - qualityIssues.total / records.length) * 100, 1)}%`,
      `Records needing transformation: ${qualityIssues.total.toLocaleString()}`,
      `  * Date format inconsistencies: ${qualityIssues.dateIssues}`,
      `  * Null handling required: ${qualityIssues.nullIssues}`,
      `  * Data type conversions: ${qualityIssues.typeConversions}`
    ]));
    
    // ETL Pipeline Recommendations
    report += createSubSection('ETL PIPELINE RECOMMENDATIONS', '');
    
    report += '\n1. EXTRACT PHASE:\n';
    report += '   - Use streaming reader for large files\n';
    report += '   - Implement incremental loads based on ' + findIncrementalColumn(columns, columnTypes) + '\n';
    report += '   - Add file validation checksums\n';
    
    report += '\n2. TRANSFORM PHASE:\n';
    report += '   ```python\n';
    report += '   # Pseudo-code for main transformations\n';
    report += '   - Standardise date formats to ISO 8601\n';
    report += '   - Convert currency strings to decimal\n';
    report += '   - Trim whitespace from all text fields\n';
    report += '   - Apply business rules:\n';
    
    const businessRules = generateBusinessRules(columns, columnTypes);
    businessRules.forEach(rule => {
      report += `     * ${rule}\n`;
    });
    report += '   ```\n';
    
    report += '\n3. LOAD PHASE:\n';
    report += '   - Bulk insert with 1000 record batches\n';
    report += '   - Implement upsert logic based on ' + findPrimaryKey(columns, columnTypes, records) + '\n';
    report += '   - Add audit columns: etl_loaded_at, etl_batch_id\n';
    
    // Data Warehouse Design
    const warehouseDesign = generateWarehouseDesign(columns, columnTypes, records);
    report += createSubSection('DATA WAREHOUSE DESIGN', 
      'Recommended: Star Schema\n\n' + warehouseDesign
    );
    
    // Performance Considerations
    const performanceRecs = generatePerformanceRecommendations(records, columns, columnTypes);
    report += createSubSection('PERFORMANCE CONSIDERATIONS', bulletList(performanceRecs));
    
    if (spinner) {
      spinner.succeed('Engineering analysis complete!');
    }
    console.log(report);
    
    outputHandler.finalize();
    
  } catch (error) {
    outputHandler.restore();
    if (spinner) spinner.fail('Error analyzing engineering requirements');
    console.error(error.message);
    if (!options.quiet) process.exit(1);
    throw error;
  }
}

function getSQLType(type, values) {
  const padded = ' '.repeat(Math.max(25 - type.type.length, 1));
  
  switch (type.type) {
    case 'identifier':
      const maxLength = Math.max(...values.filter(v => v).map(v => String(v).length));
      return `${padded}VARCHAR(${Math.max(maxLength * 1.5, 20)})`;
      
    case 'integer':
      const intValues = values.filter(v => typeof v === 'number');
      const maxInt = Math.max(...intValues);
      if (maxInt < 32767) return `${padded}SMALLINT`;
      if (maxInt < 2147483647) return `${padded}INTEGER`;
      return `${padded}BIGINT`;
      
    case 'float':
      return `${padded}DECIMAL(10,2)`;
      
    case 'date':
      const hasTime = values.some(v => v instanceof Date && (v.getHours() !== 0 || v.getMinutes() !== 0));
      return hasTime ? `${padded}TIMESTAMP` : `${padded}DATE`;
      
    case 'email':
      return `${padded}VARCHAR(255)`;
      
    case 'phone':
      return `${padded}VARCHAR(20)`;
      
    case 'postcode':
      return `${padded}CHAR(4)`;
      
    case 'categorical':
      const maxCatLength = Math.max(...type.categories.map(c => String(c).length));
      return `${padded}VARCHAR(${Math.max(maxCatLength * 1.5, 20)})`;
      
    default:
      const maxStrLength = Math.max(...values.filter(v => v).map(v => String(v).length));
      return `${padded}VARCHAR(${Math.max(maxStrLength * 1.5, 50)})`;
  }
}

function getConstraints(column, type, records) {
  const values = records.map(r => r[column]);
  const hasNulls = values.some(v => v === null || v === undefined);
  const isUnique = new Set(values.filter(v => v !== null)).size === values.filter(v => v !== null).length;
  
  let constraints = '';
  
  if (!hasNulls) {
    constraints += ' NOT NULL';
  }
  
  if (isUnique && type.type === 'identifier') {
    constraints += ' PRIMARY KEY';
  }
  
  if (column.toLowerCase() === 'status' && type.type === 'categorical') {
    constraints += ` CHECK (${column} IN (${type.categories.map(c => `'${c}'`).join(', ')}))`;
  }
  
  return constraints;
}

function isUniqueColumn(records, column) {
  const values = records.map(r => r[column]).filter(v => v !== null);
  return new Set(values).size === values.length;
}

function estimateTableSize(records, columnTypes) {
  let bytesPerRow = 0;
  
  Object.entries(columnTypes).forEach(([column, type]) => {
    switch (type.type) {
      case 'integer': bytesPerRow += 4; break;
      case 'float': bytesPerRow += 8; break;
      case 'date': bytesPerRow += 8; break;
      case 'identifier': bytesPerRow += 50; break;
      case 'email': bytesPerRow += 100; break;
      case 'phone': bytesPerRow += 20; break;
      case 'postcode': bytesPerRow += 4; break;
      case 'categorical': bytesPerRow += 30; break;
      default: bytesPerRow += 100;
    }
  });
  
  const totalBytes = bytesPerRow * records.length;
  return formatFileSize(totalBytes * 1.5); // Account for indexes and overhead
}

function estimateGrowthRate(records, columns, columnTypes) {
  const dateColumns = columns.filter(col => columnTypes[col].type === 'date');
  
  if (dateColumns.length === 0) {
    return 'Unable to estimate (no date column found)';
  }
  
  const dateCol = dateColumns[0];
  const dates = records.map(r => r[dateCol]).filter(d => d instanceof Date).sort((a, b) => a - b);
  
  if (dates.length < 2) {
    return 'Unable to estimate (insufficient date data)';
  }
  
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  const daysDiff = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
  
  if (daysDiff === 0) {
    return 'All records from same day';
  }
  
  const recordsPerDay = records.length / daysDiff;
  return `~${Math.round(recordsPerDay)} new records per day (based on date analysis)`;
}

function estimateUpdateFrequency(records, columns) {
  const updatedAtColumns = columns.filter(col => 
    col.toLowerCase().includes('updated') || 
    col.toLowerCase().includes('modified')
  );
  
  const createdAtColumns = columns.filter(col => 
    col.toLowerCase().includes('created') || 
    col.toLowerCase().includes('added')
  );
  
  if (updatedAtColumns.length > 0 && createdAtColumns.length > 0) {
    const updatedCount = records.filter(r => {
      const created = r[createdAtColumns[0]];
      const updated = r[updatedAtColumns[0]];
      return created && updated && created < updated;
    }).length;
    
    return `${formatNumber(updatedCount / records.length * 100, 1)}% of records have updated_at > created_at`;
  }
  
  return 'Unable to determine (no timestamp columns found)';
}

function analyzeNormalization(records, columns, columnTypes) {
  const issues = [];
  
  // Check for repeated groups
  const textColumns = columns.filter(col => 
    ['string', 'categorical'].includes(columnTypes[col].type)
  );
  
  textColumns.forEach(col => {
    const values = records.map(r => r[col]).filter(v => v);
    const uniqueRatio = new Set(values).size / values.length;
    
    if (uniqueRatio < 0.1 && values.length > 100) {
      issues.push(`${col} appears in ${formatNumber((1 - uniqueRatio) * 100, 1)}% of rows (consider separate dimension table)`);
    }
  });
  
  // Check for JSON-like columns
  columns.forEach(col => {
    const sample = records.slice(0, 10).map(r => r[col]).filter(v => v);
    if (sample.some(v => String(v).includes('{') || String(v).includes('['))) {
      issues.push(`${col} may contain JSON data - consider normalizing into separate table`);
    }
  });
  
  // Check for composite columns
  columns.forEach(col => {
    if (col.includes('_and_') || col.includes('&')) {
      issues.push(`${col} appears to be composite - consider splitting into separate columns`);
    }
  });
  
  return issues;
}

function detectNormalForm(issues) {
  if (issues.length === 0) return '3NF (Third Normal Form)';
  if (issues.length <= 2) return '2NF (Second Normal Form)';
  return '1NF (First Normal Form) - significant denormalization detected';
}

function analyzeDataQuality(records, columnTypes) {
  const issues = {
    total: 0,
    dateIssues: 0,
    nullIssues: 0,
    typeConversions: 0
  };
  
  records.forEach(record => {
    let hasIssue = false;
    
    Object.entries(record).forEach(([column, value]) => {
      const type = columnTypes[column];
      
      // Check for null issues
      if (value === null || value === undefined || value === '') {
        issues.nullIssues++;
        hasIssue = true;
      }
      
      // Check for date issues
      if (type.type === 'date' && value && !(value instanceof Date)) {
        issues.dateIssues++;
        hasIssue = true;
      }
      
      // Check for type conversion needs
      if (type.type === 'integer' && value && typeof value === 'string') {
        issues.typeConversions++;
        hasIssue = true;
      }
    });
    
    if (hasIssue) issues.total++;
  });
  
  return issues;
}

function findIncrementalColumn(columns, columnTypes) {
  // Look for timestamp columns
  const timestampColumns = columns.filter(col => 
    columnTypes[col].type === 'date' && 
    (col.toLowerCase().includes('updated') || 
     col.toLowerCase().includes('modified') ||
     col.toLowerCase().includes('created'))
  );
  
  if (timestampColumns.length > 0) {
    return timestampColumns[0] + ' timestamp';
  }
  
  // Look for auto-increment ID
  const idColumns = columns.filter(col => 
    columnTypes[col].type === 'identifier' || 
    columnTypes[col].type === 'integer'
  );
  
  if (idColumns.length > 0) {
    return idColumns[0] + ' (if auto-incrementing)';
  }
  
  return 'created_at timestamp (recommend adding)';
}

function generateBusinessRules(columns, columnTypes) {
  const rules = [];
  
  // Status columns
  const statusColumns = columns.filter(col => col.toLowerCase().includes('status'));
  if (statusColumns.length > 0) {
    rules.push(`Set default ${statusColumns[0]} = 'pending' where null`);
  }
  
  // ID validation
  const idColumns = columns.filter(col => col.toLowerCase().includes('_id') && !col.toLowerCase().includes('transaction'));
  if (idColumns.length > 0) {
    rules.push(`Validate ${idColumns[0]} exists in reference table`);
  }
  
  // Amount validation
  const amountColumns = columns.filter(col => 
    col.toLowerCase().includes('amount') || 
    col.toLowerCase().includes('price') ||
    col.toLowerCase().includes('total')
  );
  if (amountColumns.length > 0) {
    rules.push(`Ensure ${amountColumns[0]} >= 0`);
  }
  
  // Date validation
  const dateColumns = columns.filter(col => columnTypes[col].type === 'date');
  if (dateColumns.length > 0) {
    rules.push('Validate dates are not in future (unless valid)');
  }
  
  return rules;
}

function findPrimaryKey(columns, columnTypes, records) {
  // Look for ID columns
  const idColumns = columns.filter(col => 
    (columnTypes[col].type === 'identifier' || col.toLowerCase().includes('_id')) &&
    isUniqueColumn(records, col)
  );
  
  if (idColumns.length > 0) {
    return idColumns[0];
  }
  
  // Look for unique composite key
  const uniqueColumns = columns.filter(col => isUniqueColumn(records, col));
  if (uniqueColumns.length > 0) {
    return uniqueColumns[0];
  }
  
  return 'composite key (needs analysis)';
}

function generateWarehouseDesign(columns, columnTypes, records) {
  let design = '';
  
  // Identify fact vs dimension columns
  const measureColumns = columns.filter(col => 
    ['integer', 'float'].includes(columnTypes[col].type) &&
    (col.toLowerCase().includes('amount') || 
     col.toLowerCase().includes('count') ||
     col.toLowerCase().includes('quantity') ||
     col.toLowerCase().includes('total'))
  );
  
  const dimensionColumns = columns.filter(col => 
    columnTypes[col].type === 'categorical' ||
    col.toLowerCase().includes('_id') ||
    col.toLowerCase().includes('type') ||
    col.toLowerCase().includes('category')
  );
  
  design += 'Fact Table: fact_' + measureColumns[0]?.toLowerCase().replace(/[^a-z]/g, '_') || 'transactions' + '\n';
  design += '- Grain: One row per record\n';
  design += '- Measures: ' + (measureColumns.length > 0 ? measureColumns.join(', ') : 'count(*)') + '\n';
  design += '- Keys: ' + dimensionColumns.filter(c => c.includes('_id')).join(', ') + '\n\n';
  
  design += 'Dimension Tables:\n';
  
  // Customer dimension
  if (columns.some(c => c.toLowerCase().includes('customer'))) {
    design += '1. dim_customer (Type 2 SCD recommended)\n';
  }
  
  // Date dimension
  if (columns.some(c => columnTypes[c].type === 'date')) {
    design += '2. dim_date (pre-populate 10 years)\n';
  }
  
  // Product dimension
  if (columns.some(c => c.toLowerCase().includes('product') || c.toLowerCase().includes('sku'))) {
    design += '3. dim_product (Type 1 SCD)\n';
  }
  
  // Category dimensions
  const categoryColumns = columns.filter(c => columnTypes[c].type === 'categorical');
  categoryColumns.forEach((col, idx) => {
    design += `${idx + 4}. dim_${col.toLowerCase()} (static dimension)\n`;
  });
  
  return design;
}

function generatePerformanceRecommendations(records, columns, columnTypes) {
  const recommendations = [];
  
  // Partitioning
  const dateColumns = columns.filter(col => columnTypes[col].type === 'date');
  if (dateColumns.length > 0 && records.length > 100000) {
    recommendations.push(`Partition by ${dateColumns[0]} (monthly partitions)`);
  }
  
  // Storage format
  if (columns.length > 20) {
    recommendations.push('Consider columnar storage for analytical queries');
  }
  
  // Compression
  const categoricalColumns = columns.filter(col => columnTypes[col].type === 'categorical');
  if (categoricalColumns.length > columns.length * 0.3) {
    recommendations.push('Compression ratio estimate: 4:1 (high categorical data)');
  } else {
    recommendations.push('Compression ratio estimate: 3:1');
  }
  
  // Materialized views
  if (dateColumns.length > 0 && records.length > 50000) {
    recommendations.push('Query patterns suggest materialized view for daily summaries');
  }
  
  // Indexing strategy
  const highCardinalityColumns = columns.filter(col => {
    const unique = new Set(records.map(r => r[col])).size;
    return unique > records.length * 0.5 && unique < records.length * 0.95;
  });
  
  if (highCardinalityColumns.length > 0) {
    recommendations.push(`Consider B-tree indexes on high-cardinality columns: ${highCardinalityColumns.slice(0, 3).join(', ')}`);
  }
  
  return recommendations;
}