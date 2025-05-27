/**
 * Unified Output Formatting System for DataPilot
 * Provides consistent styling, colors, and formatting across all commands
 */

import chalk from 'chalk';
import boxen from 'boxen';
import Table from 'cli-table3';
import { createSpinner } from 'nanospinner';

/**
 * Unified color palette for consistent styling
 */
export const colors = {
  // Primary brand colors
  primary: chalk.cyan,           // Main brand color
  secondary: chalk.blue,         // Secondary actions
  accent: chalk.magenta,         // Highlights
  
  // Semantic colors
  success: chalk.green,          // Success messages
  error: chalk.red,              // Error messages
  warning: chalk.yellow,         // Warning messages
  info: chalk.blue,              // Information
  
  // UI elements
  heading: chalk.bold.cyan,      // Major headings
  subheading: chalk.bold.white,  // Subheadings
  label: chalk.gray,             // Labels
  value: chalk.white,            // Values
  muted: chalk.gray,             // Less important text
  
  // Special purpose
  highlight: chalk.bold.yellow,  // Important highlights
  link: chalk.underline.blue,    // Links or references
  code: chalk.green,             // Code snippets
  number: chalk.yellow,          // Numbers and statistics
  percentage: chalk.magenta      // Percentages
};

/**
 * Standardized symbols and emojis
 */
export const symbols = {
  // Status indicators
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  
  // Progress indicators
  bullet: '•',
  arrow: '→',
  check: '✓',
  cross: '✗',
  
  // Section markers
  section: '📊',
  analysis: '🔍',
  report: '📋',
  archaeology: '🏛️',
  
  // Data types
  data: '📊',
  chart: '📈',
  table: '📋',
  database: '🗄️',
  
  // Actions
  processing: '⚙️',
  complete: '✨',
  optimize: '🚀',
  
  // Decorative
  star: '⭐',
  sparkle: '✨',
  fire: '🔥',
  lightbulb: '💡'
};

/**
 * Standardized line styles
 */
export const lines = {
  single: '─',
  double: '═',
  thick: '━',
  dotted: '·',
  dashed: '- '
};

/**
 * Create a consistent section header
 */
export function createHeader(title, subtitle = null) {
  const width = 60;
  const line = lines.double.repeat(width);
  
  let header = '\n' + colors.primary(line) + '\n';
  header += colors.heading(title.toUpperCase().padStart((width + title.length) / 2).padEnd(width)) + '\n';
  
  if (subtitle) {
    header += colors.muted(subtitle.padStart((width + subtitle.length) / 2).padEnd(width)) + '\n';
  }
  
  header += colors.primary(line) + '\n';
  
  return header;
}

/**
 * Create a consistent subsection
 */
export function createSubsection(title, icon = null) {
  const prefix = icon ? `${icon} ` : '';
  const line = lines.single.repeat(40);
  
  return '\n' + colors.subheading(`${prefix}${title}`) + '\n' + colors.muted(line) + '\n';
}

/**
 * Create a formatted list
 */
export function createList(items, options = {}) {
  const {
    bullet = symbols.bullet,
    indent = 2,
    color = 'value'
  } = options;
  
  const indentStr = ' '.repeat(indent);
  const bulletColor = colors.muted(bullet);
  const itemColor = colors[color] || colors.value;
  
  return items
    .filter(item => item != null)
    .map(item => `${indentStr}${bulletColor} ${itemColor(item)}`)
    .join('\n');
}

/**
 * Create a key-value display
 */
export function createKeyValue(key, value, options = {}) {
  const {
    keyWidth = 20,
    separator = ':',
    keyColor = 'label',
    valueColor = 'value'
  } = options;
  
  const formattedKey = colors[keyColor](key.padEnd(keyWidth));
  const formattedValue = colors[valueColor](value);
  
  return `${formattedKey}${colors.muted(separator)} ${formattedValue}`;
}

/**
 * Create a formatted table
 */
export function createTable(headers, rows, options = {}) {
  const {
    style = 'single',
    headerColor = 'heading',
    cellColor = 'value'
  } = options;
  
  const table = new Table({
    head: headers.map(h => colors[headerColor](h)),
    style: {
      head: [],
      border: []
    },
    chars: getTableChars(style)
  });
  
  rows.forEach(row => {
    table.push(row.map(cell => colors[cellColor](cell)));
  });
  
  return table.toString();
}

/**
 * Get table border characters
 */
function getTableChars(style) {
  const styles = {
    single: {
      'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
      'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
      'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
      'right': '│', 'right-mid': '┤', 'middle': '│'
    },
    double: {
      'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗',
      'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝',
      'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼',
      'right': '║', 'right-mid': '╢', 'middle': '│'
    },
    compact: {
      'top': '', 'top-mid': '', 'top-left': '', 'top-right': '',
      'bottom': '', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': '',
      'left': '', 'left-mid': '', 'mid': '', 'mid-mid': '',
      'right': '', 'right-mid': '', 'middle': ' '
    }
  };
  
  return styles[style] || styles.single;
}

/**
 * Create a formatted box
 */
export function createBox(content, options = {}) {
  const {
    title = null,
    padding = 1,
    margin = 1,
    borderStyle = 'single',
    borderColor = 'primary',
    align = 'left'
  } = options;
  
  const boxOptions = {
    padding,
    margin,
    borderStyle,
    borderColor: borderColor,
    align,
    title
  };
  
  return boxen(content, boxOptions);
}

/**
 * Format numbers consistently
 */
export function formatNumber(value, options = {}) {
  const {
    decimals = 2,
    useColor = true,
    showSign = false
  } = options;
  
  if (value == null || isNaN(value)) return 'N/A';
  
  let formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  
  if (showSign && value > 0) {
    formatted = '+' + formatted;
  }
  
  if (!useColor) return formatted;
  
  if (value > 0) return colors.success(formatted);
  if (value < 0) return colors.error(formatted);
  return colors.value(formatted);
}

/**
 * Format percentages consistently
 */
export function formatPercent(value, options = {}) {
  const {
    decimals = 1,
    useColor = true
  } = options;
  
  if (value == null || isNaN(value)) return 'N/A';
  
  const formatted = `${(value * 100).toFixed(decimals)}%`;
  
  if (!useColor) return formatted;
  
  if (value >= 0.9) return colors.success(formatted);
  if (value >= 0.7) return colors.warning(formatted);
  if (value < 0.5) return colors.error(formatted);
  return colors.percentage(formatted);
}

/**
 * Create a progress bar
 */
export function createProgressBar(current, total, options = {}) {
  const {
    width = 30,
    completeChar = '█',
    incompleteChar = '░',
    showPercentage = true
  } = options;
  
  const percentage = Math.min(100, Math.round((current / total) * 100));
  const completed = Math.round((width * percentage) / 100);
  const remaining = width - completed;
  
  let bar = colors.success(completeChar.repeat(completed));
  bar += colors.muted(incompleteChar.repeat(remaining));
  
  if (showPercentage) {
    bar += ` ${formatPercent(current / total)}`;
  }
  
  return bar;
}

/**
 * Create a standardized spinner
 */
export function createStandardSpinner(text, options = {}) {
  const {
    color = 'cyan'
  } = options;
  
  const spinner = createSpinner(text);
  spinner.color = color;
  
  return {
    ...spinner,
    
    // Standardized update messages
    updateProgress(current, total, message = 'Processing') {
      const percentage = Math.round((current / total) * 100);
      spinner.update({ text: `${message}... ${percentage}%` });
    },
    
    // Standardized success
    succeed(message = 'Complete') {
      spinner.success({ text: colors.success(`${symbols.success} ${message}`) });
    },
    
    // Standardized error
    fail(message = 'Failed') {
      spinner.error({ text: colors.error(`${symbols.error} ${message}`) });
    },
    
    // Standardized warning
    warn(message) {
      spinner.warn({ text: colors.warning(`${symbols.warning} ${message}`) });
    }
  };
}

/**
 * Format file size consistently
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(2);
  
  return colors.number(`${size} ${sizes[i]}`);
}

/**
 * Format duration consistently
 */
export function formatDuration(ms) {
  if (ms < 1000) return colors.number(`${ms}ms`);
  if (ms < 60000) return colors.number(`${(ms / 1000).toFixed(1)}s`);
  
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return colors.number(`${minutes}m ${seconds}s`);
}

/**
 * Create a summary box
 */
export function createSummaryBox(title, items, options = {}) {
  const content = items
    .filter(item => item != null)
    .map(item => {
      if (typeof item === 'object' && item.label && item.value) {
        return createKeyValue(item.label, item.value);
      }
      return item;
    })
    .join('\n');
  
  return createBox(content, {
    title,
    borderColor: 'cyan',
    ...options
  });
}

/**
 * Create a warning message
 */
export function createWarning(message) {
  return colors.warning(`${symbols.warning} ${message}`);
}

/**
 * Create an error message
 */
export function createError(message) {
  return colors.error(`${symbols.error} ${message}`);
}

/**
 * Create a success message
 */
export function createSuccess(message) {
  return colors.success(`${symbols.success} ${message}`);
}

/**
 * Create an info message
 */
export function createInfo(message) {
  return colors.info(`${symbols.info} ${message}`);
}

/**
 * Format command output consistently
 */
export class OutputFormatter {
  constructor(commandName) {
    this.commandName = commandName;
    this.sections = [];
  }
  
  addHeader(title, subtitle) {
    this.sections.push(createHeader(title, subtitle));
    return this;
  }
  
  addSection(title, content, icon = null) {
    this.sections.push(createSubsection(title, icon));
    this.sections.push(content);
    return this;
  }
  
  addList(title, items, options = {}) {
    this.sections.push(createSubsection(title, options.icon));
    this.sections.push(createList(items, options));
    return this;
  }
  
  addTable(title, headers, rows, options = {}) {
    this.sections.push(createSubsection(title, options.icon));
    this.sections.push(createTable(headers, rows, options));
    return this;
  }
  
  addSummary(title, items, options = {}) {
    this.sections.push(createSummaryBox(title, items, options));
    return this;
  }
  
  addSeparator() {
    this.sections.push('\n' + colors.muted(lines.single.repeat(60)) + '\n');
    return this;
  }
  
  render() {
    return this.sections.join('\n');
  }
}

/**
 * Standard command execution wrapper
 */
export async function withStandardFormatting(commandName, fn) {
  const spinner = createStandardSpinner(`Initializing ${commandName}...`);
  
  try {
    spinner.start();
    const result = await fn(spinner);
    spinner.succeed(`${commandName} complete!`);
    return result;
  } catch (error) {
    spinner.fail(`${commandName} failed: ${error.message}`);
    throw error;
  }
}