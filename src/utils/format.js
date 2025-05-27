import chalk from 'chalk';

// Removed import of deleted unifiedFormat.js - using local implementations

// Define missing exports that were previously in unifiedFormat.js
export const colors = {
  primary: chalk.blue,
  success: chalk.green,
  warning: chalk.yellow,
  error: chalk.red,
  info: chalk.cyan,
  muted: chalk.gray
};

export const symbols = {
  success: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
  bullet: '•'
};

export const createSuccess = (text) => `${colors.success(symbols.success)} ${text}`;
export const createWarning = (text) => `${colors.warning(symbols.warning)} ${text}`;
export const createError = (text) => `${colors.error(symbols.error)} ${text}`;

export const createHeader = (text) => `\n${colors.primary('═'.repeat(60))}\n${colors.primary(text.toUpperCase().padStart((60 + text.length) / 2))}\n${colors.primary('═'.repeat(60))}`;
export const createSubsection = (title, content = '') => `\n${colors.info(title)}\n${'─'.repeat(40)}\n${content}`;
export const createTable = (data) => JSON.stringify(data, null, 2);
export const createList = (items) => items.map(item => `${symbols.bullet} ${item}`).join('\n');
export const createStandardSpinner = (text) => ({ text });
export const formatPercent = (value) => `${(value * 100).toFixed(1)}%`;

export class OutputFormatter {
  constructor(options = {}) {
    this.options = options;
  }
  
  format(text) {
    return text;
  }
}

export function formatNumber(num, decimals = 2) {
  if (typeof num !== 'number' || isNaN(num)) return 'N/A';
  
  if (Math.abs(num) >= 1000000) {
    return (num / 1000000).toFixed(decimals) + 'M';
  } else if (Math.abs(num) >= 1000) {
    return (num / 1000).toFixed(decimals) + 'K';
  }
  
  return num.toFixed(decimals);
}

export function formatCurrency(num, currency = '$') {
  if (typeof num !== 'number' || isNaN(num)) return 'N/A';
  return currency + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatPercentage(num, decimals = 1) {
  if (typeof num !== 'number' || isNaN(num)) return 'N/A';
  return (num * 100).toFixed(decimals) + '%';
}

export function formatDate(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) return 'N/A';
  return date.toISOString().split('T')[0];
}

export function formatFileSize(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
}

export function createSection(title, content) {
  // Use unified formatting for consistency
  return unifiedHeader(title) + content;
}

export function createSubSection(title, content) {
  // Use unified formatting for consistency
  return unifiedSubsection(title) + content;
}

export function bulletList(items) {
  return items.map(item => `- ${item}`).join('\n');
}

export function numberedList(items) {
  return items.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
}

export function table(headers, rows) {
  const columnWidths = headers.map((header, idx) => {
    const headerWidth = header.length;
    const maxRowWidth = Math.max(...rows.map(row => String(row[idx]).length));
    return Math.max(headerWidth, maxRowWidth) + 2;
  });
  
  const headerRow = headers.map((header, idx) => 
    header.padEnd(columnWidths[idx])
  ).join('|');
  
  const separator = columnWidths.map(width => '-'.repeat(width)).join('|');
  
  const dataRows = rows.map(row => 
    row.map((cell, idx) => String(cell).padEnd(columnWidths[idx])).join('|')
  ).join('\n');
  
  return `${headerRow}\n${separator}\n${dataRows}`;
}

export function progressBar(current, total, width = 40) {
  const percentage = current / total;
  const filled = Math.round(width * percentage);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `[${bar}] ${formatPercentage(percentage)}`;
}

export function highlight(text, type = 'info') {
  const styles = {
    info: chalk.blue,
    success: chalk.green,
    warning: chalk.yellow,
    error: chalk.red,
    important: chalk.bold.cyan
  };
  
  return styles[type] ? styles[type](text) : text;
}

export function formatColumnAnalysis(column, stats, type) {
  const lines = [];
  
  lines.push(`[Column: ${column}]`);
  lines.push(`- Data type: ${type.type}`);
  lines.push(`- Non-null count: ${stats.count} (${formatPercentage(stats.count / (stats.count + stats.nullCount))})`);
  
  if (stats.nullCount > 0) {
    lines.push(`- Missing values: ${stats.nullCount} (${formatPercentage(stats.nullCount / (stats.count + stats.nullCount))})`);
  }
  
  if (type.type === 'integer' || type.type === 'float') {
    lines.push(`- Statistics:`);
    lines.push(`  * Mean: ${formatNumber(stats.mean)}`);
    lines.push(`  * Median: ${formatNumber(stats.median)}`);
    lines.push(`  * Mode: ${formatNumber(stats.mode)}`);
    lines.push(`  * Std Dev: ${formatNumber(stats.standardDeviation)}`);
    lines.push(`  * Min: ${formatNumber(stats.min)}`);
    lines.push(`  * Max: ${formatNumber(stats.max)}`);
    lines.push(`  * 25th percentile: ${formatNumber(stats.q1)}`);
    lines.push(`  * 75th percentile: ${formatNumber(stats.q3)}`);
    
    if (Math.abs(stats.skewness) > 0.5) {
      lines.push(`- Distribution: ${stats.skewness > 0 ? 'Right-skewed' : 'Left-skewed'} (${formatNumber(stats.skewness, 2)})`);
    } else {
      lines.push(`- Distribution: Approximately normal (skewness: ${formatNumber(stats.skewness, 2)})`);
    }
    
    if (stats.outliers.length > 0) {
      lines.push(`- Outliers: ${stats.outliers.length} values beyond 1.5 * IQR`);
    }
  } else if (type.type === 'categorical') {
    lines.push(`- Unique values: ${type.categories.length}`);
    lines.push(`- Most common: ${type.categories.slice(0, 5).join(', ')}${type.categories.length > 5 ? '...' : ''}`);
  } else if (type.type === 'identifier') {
    lines.push(`- Unique values: ${stats.count} (likely a primary key or identifier)`);
  }
  
  return lines.join('\n');
}

export function formatTimestamp() {
  return new Date().toISOString().replace('T', ' ').split('.')[0];
}

export function formatSmallDatasetWarning(rowCount) {
  if (rowCount < 20) {
    return {
      warning: `⚠️  Small dataset detected (${rowCount} rows) - Statistical analysis may be unreliable`,
      analysisMode: 'full_scan',
      showFullData: rowCount < 10,
      confidenceMultiplier: 0.7
    };
  }
  return null;
}

export function formatDataTable(records, columns) {
  if (!records || records.length === 0) return 'No data to display';
  
  // Calculate column widths
  const columnWidths = {};
  columns.forEach(col => {
    columnWidths[col] = Math.max(
      col.length,
      ...records.map(r => String(r[col] || '').length)
    );
    // Cap at reasonable width
    columnWidths[col] = Math.min(columnWidths[col], 30);
  });
  
  // Build header
  let table = '\n┌' + columns.map(col => '─'.repeat(columnWidths[col] + 2)).join('┬') + '┐\n';
  table += '│ ' + columns.map(col => col.padEnd(columnWidths[col])).join(' │ ') + ' │\n';
  table += '├' + columns.map(col => '─'.repeat(columnWidths[col] + 2)).join('┼') + '┤\n';
  
  // Build rows
  records.forEach(record => {
    table += '│ ' + columns.map(col => {
      let val = String(record[col] || '');
      if (val.length > columnWidths[col]) {
        val = val.substring(0, columnWidths[col] - 3) + '...';
      }
      return val.padEnd(columnWidths[col]);
    }).join(' │ ') + ' │\n';
  });
  
  table += '└' + columns.map(col => '─'.repeat(columnWidths[col] + 2)).join('┴') + '┘\n';
  
  return table;
}