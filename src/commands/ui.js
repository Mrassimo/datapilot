/**
 * Interactive Terminal UI Command
 * Fun, colorful, beginner-friendly interface with animations
 */

// Note: blessed has bundling issues, using simpler alternatives
import enquirer from 'enquirer';
const { prompt } = enquirer;
// Remove figlet import - use fallback ASCII for Windows compatibility
// import figlet from 'figlet';
import boxen from 'boxen';
import { createSpinner } from 'nanospinner';
import chalk from 'chalk';

// Color fallbacks for gradient-string issues - removed to avoid bundling issues

// Safe color functions with fallbacks
const safeColors = {
  rainbow: (text) => {
    try {
      return chalk.red(text.slice(0, text.length/6)) + 
             chalk.yellow(text.slice(text.length/6, text.length/3)) + 
             chalk.green(text.slice(text.length/3, text.length/2)) + 
             chalk.cyan(text.slice(text.length/2, 2*text.length/3)) + 
             chalk.blue(text.slice(2*text.length/3, 5*text.length/6)) + 
             chalk.magenta(text.slice(5*text.length/6));
    } catch (error) {
      return chalk.cyan(text);
    }
  },
  ocean: (text) => chalk.blue(text),
  sunset: (text) => chalk.yellow(text),
  forest: (text) => chalk.green(text),
  fire: (text) => chalk.red(text),
  cosmic: (text) => chalk.magenta(text),
  cyan: (text) => chalk.cyan(text),
  green: (text) => chalk.green(text),
  blue: (text) => chalk.blue(text),
  red: (text) => chalk.red(text),
  yellow: (text) => chalk.yellow(text),
  magenta: (text) => chalk.magenta(text)
};
import fs from 'fs';
import path from 'path';
import { parseCSV, detectColumnTypes } from '../utils/parser.js';
import { eda } from './eda.js';
import { integrity } from './int.js';
import { visualize } from './vis.js';
import { llmContext } from './llm.js';

// Create comprehensive color object with ALL needed functions
const gradients = {
  // Base color functions
  rainbow: (text) => safeColors.rainbow(text),
  ocean: (text) => safeColors.ocean(text),
  sunset: (text) => safeColors.sunset(text),
  forest: (text) => safeColors.forest(text),
  fire: (text) => safeColors.fire(text),
  cosmic: (text) => safeColors.cosmic(text),
  cyan: (text) => safeColors.cyan(text),
  green: (text) => safeColors.green(text),
  blue: (text) => safeColors.blue(text),
  red: (text) => safeColors.red(text),
  yellow: (text) => safeColors.yellow(text),
  magenta: (text) => safeColors.magenta(text),
  // Fallback for any missing color
  purple: (text) => chalk.magenta(text),
  gray: (text) => chalk.gray(text),
  grey: (text) => chalk.gray(text),
  white: (text) => chalk.white(text),
  black: (text) => chalk.black(text)
};

// Recent files storage
const RECENT_FILES_PATH = path.join(process.env.HOME || process.env.USERPROFILE, '.datapilot_recent.json');
const MAX_RECENT_FILES = 10;

// Navigation state
let navigationStack = [];

export async function interactiveUI() {
  console.clear();
  
  try {
    // Welcome animation
    await showWelcomeAnimation();
    
    // Main interactive loop
    let running = true;
    while (running) {
      try {
        const action = await showMainMenu();
        
        switch (action) {
          case 'analyze':
            await runGuidedAnalysis();
            break;
          case 'demo':
            await runDemo();
            break;
          case 'exit':
            running = false;
            break;
        }
      } catch (error) {
        console.error(chalk.red('An error occurred:'), error.message);
        const continueChoice = await prompt({
          type: 'confirm',
          name: 'continue',
          message: 'Would you like to continue?',
          initial: true
        });
        
        if (!continueChoice.continue) {
          running = false;
        }
      }
    }
    
    // Goodbye animation
    await showGoodbyeAnimation();
    
  } catch (error) {
    console.error(chalk.red('Fatal error in interactive UI:'), error.message);
    process.exit(1);
  }
}

async function showWelcomeAnimation() {
  console.clear();
  
  // Use static ASCII art for maximum Windows compatibility (no figlet)
  const title = `
  ____        _        ____  _ _       _   
 |  _ \\  __ _| |_ __ _|  _ \\(_) | ___ | |_ 
 | | | |/ _\` | __/ _\` | |_) | | |/ _ \\| __|
 | |_| | (_| | || (_| |  __/| | | (_) | |_ 
 |____/ \\__,_|\\__\\__,_|_|   |_|_|\\___/ \\__|
                                           
        🚀 CSV Analysis Made Simple 🚀    
  `;
  
  // Animate the title with colors
  const lines = title.split('\\n');
  for (let i = 0; i < lines.length; i++) {
    const gradientName = Object.keys(gradients)[i % Object.keys(gradients).length];
    console.log(gradients[gradientName](lines[i]));
    await sleep(200);
  }
  
  await sleep(500);
  
  // Welcome message with box
  const welcomeMsg = boxen(
    gradients.rainbow('🚀 Welcome to DataPilot Interactive! 🚀\\n\\n') +
    '✨ Your fun, colorful data analysis companion\\n' +
    '🎯 Perfect for beginners and experts alike\\n' +
    '📊 Discover insights in your CSV data\\n' +
    '🤖 LLM-ready analysis output',
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan'
    }
  );
  
  console.log(welcomeMsg);
  await sleep(1000);
}

async function showMainMenu() {
  const response = await prompt({
    type: 'select',
    name: 'action',
    message: gradients.cyan('🚀 What would you like to do?'),
    choices: [
      {
        name: 'analyze',
        message: '📊 Analyze CSV Data',
        hint: 'Smart file discovery and guided analysis'
      },
      {
        name: 'demo',
        message: '🎭 Try Demo Mode',
        hint: 'See DataPilot in action with built-in sample datasets'
      },
      {
        name: 'exit',
        message: '👋 Exit DataPilot',
        hint: 'Thanks for using DataPilot!'
      }
    ]
  });
  
  return response.action;
}

async function runGuidedAnalysis() {
  console.clear();
  console.log(gradients.ocean('🔍 Guided Analysis Mode 🔍\\n'));
  
  // Step 1: File selection
  const filePath = await selectFile();
  if (!filePath) return;
  
  // Step 2: File preview
  await showFilePreview(filePath);
  
  // Step 3: Analysis type selection
  const analysisType = await selectAnalysisType();
  
  // Step 4: Run analysis with beautiful loading
  await runAnalysisWithAnimation(filePath, analysisType);
  
  // Step 5: Show results
  await showResults();
  
  await prompt({
    type: 'confirm',
    name: 'continue',
    message: gradients.rainbow('Analysis complete! Return to main menu?'),
    initial: true
  });
}

async function selectFile() {
  // Auto-discover CSV files in current directory
  const discoveredFiles = await discoverCSVFiles();
  
  const choices = [];
  
  // Add discovered files if any
  if (discoveredFiles.length > 0) {
    choices.push({
      name: 'discovered',
      message: `🎯 Use discovered CSV files (${discoveredFiles.length} found)`,
      hint: discoveredFiles.slice(0, 3).map(f => path.basename(f)).join(', ') + (discoveredFiles.length > 3 ? '...' : '')
    });
  }
  
  choices.push(
    { name: 'browse', message: '📂 Browse files interactively' },
    { name: 'path', message: '⌨️  Type file path directly' },
    { name: 'recent', message: '🕐 Use recent files' },
    { name: 'workspace', message: '🏢 Workspace mode (multiple CSVs)' },
    { name: 'back', message: '← Back to main menu' }
  );
  
  const methods = await prompt({
    type: 'select',
    name: 'method',
    message: 'How would you like to select your CSV file?',
    choices
  });
  
  switch (methods.method) {
    case 'discovered':
      return await selectFromDiscovered(discoveredFiles);
    case 'browse':
      return await browseFiles();
    case 'path':
      return await enterFilePath();
    case 'recent':
      return await selectRecentFile();
    case 'workspace':
      return await workspaceMode(discoveredFiles);
    case 'back':
      return null;
  }
}

async function browseFiles() {
  console.log(gradients.forest('\\n🌲 File Browser 🌲\\n'));
  
  let currentDir = process.cwd();
  
  while (true) {
    try {
      const items = fs.readdirSync(currentDir, { withFileTypes: true });
      const choices = [];
      
      // Add parent directory option
      if (currentDir !== '/') {
        choices.push({
          name: '..',
          message: '📁 .. (Parent Directory)',
          value: path.dirname(currentDir)
        });
      }
      
      // Add directories
      items
        .filter(item => item.isDirectory())
        .forEach(dir => {
          choices.push({
            name: path.join(currentDir, dir.name),
            message: `📁 ${dir.name}/`,
            value: path.join(currentDir, dir.name)
          });
        });
      
      // Add CSV files
      items
        .filter(item => item.isFile() && item.name.endsWith('.csv'))
        .forEach(file => {
          choices.push({
            name: path.join(currentDir, file.name),
            message: `📊 ${file.name}`,
            value: path.join(currentDir, file.name)
          });
        });
      
      // Add exit option
      choices.push({
        name: 'exit',
        message: '← Back to file selection',
        value: 'exit'
      });
      
      const result = await prompt({
        type: 'select',
        name: 'selection',
        message: `Current: ${currentDir}`,
        choices
      });
      
      if (result.selection === 'exit') {
        return null;
      }
      
      const selected = result.selection;
      
      // Check if it's a directory
      if (fs.statSync(selected).isDirectory()) {
        currentDir = selected;
        continue;
      }
      
      // It's a file, return it
      return selected;
      
    } catch (error) {
      console.log(chalk.red(`Error reading directory: ${error.message}`));
      return null;
    }
  }
}

async function enterFilePath() {
  const response = await prompt({
    type: 'input',
    name: 'filePath',
    message: 'Enter the path to your CSV file:',
    validate: (input) => {
      if (!input.trim()) return 'Please enter a file path';
      if (!fs.existsSync(input)) return 'File does not exist';
      if (!input.endsWith('.csv')) return 'Please select a CSV file';
      return true;
    }
  });
  
  return response.filePath;
}

async function selectRecentFile() {
  const recentFiles = getRecentFiles();
  
  if (recentFiles.length === 0) {
    console.log(gradients.yellow('No recent files found.'));
    await prompt({
      type: 'confirm',
      name: 'continue',
      message: 'Press Enter to continue...'
    });
    return null;
  }
  
  const choices = recentFiles.map(file => ({
    name: file.path,
    message: `📊 ${path.basename(file.path)}`,
    hint: `Last used: ${new Date(file.lastUsed).toLocaleDateString()}`
  }));
  
  choices.push({ name: 'back', message: '← Back to file selection' });
  
  const response = await prompt({
    type: 'select',
    name: 'file',
    message: 'Select a recent file:',
    choices
  });
  
  return response.file === 'back' ? null : response.file;
}

function getRecentFiles() {
  try {
    if (fs.existsSync(RECENT_FILES_PATH)) {
      return JSON.parse(fs.readFileSync(RECENT_FILES_PATH, 'utf8'));
    }
  } catch (error) {
    // Ignore errors
  }
  return [];
}

function addRecentFile(filePath) {
  const recentFiles = getRecentFiles();
  
  // Remove if already exists
  const filtered = recentFiles.filter(f => f.path !== filePath);
  
  // Add to front
  filtered.unshift({
    path: filePath,
    lastUsed: new Date().toISOString()
  });
  
  // Keep only MAX_RECENT_FILES
  const trimmed = filtered.slice(0, MAX_RECENT_FILES);
  
  try {
    fs.writeFileSync(RECENT_FILES_PATH, JSON.stringify(trimmed, null, 2));
  } catch (error) {
    // Ignore errors
  }
}

async function showFilePreview(filePath) {
  const spinner = createSpinner('Loading file preview...').start();
  
  try {
    const stats = fs.statSync(filePath);
    const records = await parseCSV(filePath);
    
    // Handle empty file
    if (!records || records.length === 0) {
      spinner.error({ text: 'File is empty or could not be parsed' });
      return;
    }
    
    const headers = Object.keys(records[0]);
    const columnTypes = detectColumnTypes(records);
    
    spinner.success({ text: 'File loaded successfully!' });
    
    // File info
    const previewBox = boxen(
      `📄 File: ${path.basename(filePath)}\\n` +
      `📊 Size: ${formatFileSize(stats.size)}\\n` +
      `📈 Rows: ~${records.length}+ rows\\n` +
      `🏛️  Columns: ${Object.keys(columnTypes).length} columns\\n\\n` +
      `📋 Preview:\\n${formatPreviewTable(records, headers)}`,
      {
        padding: 1,
        borderColor: 'blue'
      }
    );
    
    console.log('\\n' + previewBox);
    
    // Add to recent files
    addRecentFile(filePath);
    
  } catch (error) {
    spinner.error({ text: `Error loading file: ${error.message}` });
    throw error;
  }
}

async function selectAnalysisType() {
  const response = await prompt({
    type: 'select',
    name: 'analysis',
    message: 'What type of analysis would you like to run?',
    choices: [
      { name: 'complete', message: '🚀 Complete Analysis (All commands)' },
      { name: 'eda', message: '📊 Exploratory Data Analysis' },
      { name: 'int', message: '🔍 Data Integrity Check' },
      { name: 'vis', message: '📈 Visualization Recommendations' },
      { name: 'llm', message: '🤖 LLM Context Generation' }
    ]
  });
  
  return response.analysis;
}

let currentResult = null;

async function runAnalysisWithAnimation(filePath, analysisType) {
  console.log(gradients.fire('\\n🔥 Running Analysis 🔥\\n'));
  
  const spinner = createSpinner('Parsing CSV file...').start();
  
  try {
    const data = await parseCSV(filePath);
    const headers = Object.keys(data[0] || {});
    spinner.update({ text: 'CSV parsed successfully!' });
    await sleep(500);
    
    if (analysisType === 'complete') {
      const analyses = ['eda', 'int', 'vis', 'llm'];
      let combinedResult = '';
      
      for (const analysis of analyses) {
        spinner.update({ text: `Running ${analysis.toUpperCase()} analysis...` });
        
        let result;
        switch (analysis) {
          case 'eda':
            result = await eda(filePath, { preloadedData: { records: data, columnTypes: detectColumnTypes(data) } });
            break;
          case 'int':
            result = await integrity(filePath, { preloadedData: { records: data, columnTypes: detectColumnTypes(data) } });
            break;
          case 'vis':
            result = await visualize(filePath, { preloadedData: { records: data, columnTypes: detectColumnTypes(data) } });
            break;
          case 'llm':
            result = await llmContext(filePath, { preloadedData: { records: data, columnTypes: detectColumnTypes(data) } });
            break;
        }
        
        combinedResult += `\\n\\n=== ${analysis.toUpperCase()} ANALYSIS ===\\n\\n${result}`;
        await sleep(1000);
      }
      
      currentResult = combinedResult;
    } else {
      spinner.update({ text: `Running ${analysisType.toUpperCase()} analysis...` });
      
      let result;
      switch (analysisType) {
        case 'eda':
          result = await eda(filePath, { preloadedData: { records: data, columnTypes: detectColumnTypes(data) } });
          break;
        case 'int':
          result = await integrity(filePath, { preloadedData: { records: data, columnTypes: detectColumnTypes(data) } });
          break;
        case 'vis':
          result = await visualize(filePath, { preloadedData: { records: data, columnTypes: detectColumnTypes(data) } });
          break;
        case 'llm':
          result = await llmContext(filePath, { preloadedData: { records: data, columnTypes: detectColumnTypes(data) } });
          break;
      }
      
      currentResult = result;
    }
    
    spinner.success({ text: 'Analysis complete! 🎉' });
    
  } catch (error) {
    spinner.error({ text: `Analysis failed: ${error.message}` });
    throw error;
  }
}

async function showResults() {
  if (!currentResult) {
    console.log(chalk.red('No results to display.'));
    return;
  }
  
  console.log(gradients.rainbow('\\n🎉 Analysis Results 🎉\\n'));
  
  // Always offer save first
  const wantToSave = await prompt({
    type: 'confirm',
    name: 'save',
    message: '💾 Would you like to save your analysis results?',
    initial: true
  });
  
  if (wantToSave.save) {
    await saveResults(currentResult);
  }
  
  // Then offer other options
  const action = await prompt({
    type: 'select',
    name: 'action',
    message: 'What would you like to do with the results?',
    choices: [
      { name: 'view', message: '👀 View results in terminal' },
      { name: 'copy', message: '📋 Show selectable text for copying' },
      { name: 'ai', message: '🤖 Format for AI analysis' },
      { name: 'back', message: '← Back to main menu' }
    ]
  });
  
  switch (action.action) {
    case 'view':
      await viewResults(currentResult);
      break;
    case 'copy':
      await showSelectableResults(currentResult);
      break;
    case 'ai':
      await copyForAI(currentResult);
      break;
    case 'back':
      return;
  }
}

async function viewResults(result) {
  console.clear();
  console.log(gradients.cosmic('📊 Analysis Results 📊\\n'));
  console.log(result);
  
  await prompt({
    type: 'confirm',
    name: 'continue',
    message: '\\nPress Enter to continue...'
  });
}

async function saveResults(result) {
  const saveChoice = await prompt({
    type: 'select',
    name: 'format',
    message: 'Choose filename format:',
    choices: [
      { name: 'custom', message: '✏️  Custom filename' },
      { name: 'timestamped', message: '🕐 Auto-timestamped filename' }
    ]
  });
  
  let filename;
  switch (saveChoice.format) {
    case 'custom':
      const response = await prompt({
        type: 'input',
        name: 'filename',
        message: 'Enter filename:',
        initial: 'my-analysis.txt',
        validate: (input) => {
          if (!input.trim()) return 'Please enter a filename';
          if (!input.endsWith('.txt')) return 'Please use .txt extension';
          return true;
        }
      });
      filename = response.filename;
      break;
    case 'timestamped':
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      filename = `datapilot-analysis-${timestamp}.txt`;
      break;
  }
  
  const spinner = createSpinner(`Saving results to ${filename}...`).start();
  
  try {
    // Format results as readable text
    let output = '';
    if (typeof result === 'string') {
      output = result;
    } else {
      output = `DataPilot Analysis Results\\nGenerated: ${new Date().toISOString()}\\n\\n`;
      output += JSON.stringify(result, null, 2);
    }
    
    fs.writeFileSync(filename, output);
    spinner.success({ text: `✅ Results saved to ${filename}!` });
    
    const openFile = await prompt({
      type: 'confirm',
      name: 'open',
      message: 'Would you like to view the saved file?',
      initial: false
    });
    
    if (openFile.open) {
      console.log(chalk.cyan('\\n📄 Saved content preview:'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(output.slice(0, 500) + (output.length > 500 ? '\\n...(truncated)' : ''));
      console.log(chalk.gray('─'.repeat(50)));
    }
    
  } catch (error) {
    spinner.error({ text: `❌ Error saving file: ${error.message}` });
    console.error(chalk.red('Save failed. Please check file permissions and try again.'));
  }
  
  await prompt({
    type: 'confirm',
    name: 'continue',
    message: 'Continue?',
    initial: true
  });
}

async function copyForAI(result) {
  console.log('\\n' + gradients.cosmic('🤖 AI-Ready Analysis Context 🤖\\n'));
  
  const contextBox = boxen(
    gradients.rainbow('Perfect for AI Analysis!\\n\\n') +
    '🎯 Copy this analysis and paste into:\\n' +
    '• ChatGPT for insights\\n' +
    '• Claude for deep analysis\\n' +
    '• Any AI assistant for questions\\n\\n' +
    gradients.fire('💡 Ask: "What are the key patterns in this data?"'),
    {
      padding: 1,
      borderStyle: 'round',
      borderColor: 'magenta'
    }
  );
  
  console.log(contextBox);
  
  await prompt({
    type: 'confirm',
    name: 'continue',
    message: 'Continue?',
    initial: true
  });
}

async function showSelectableResults(result) {
  console.log('\\n' + gradients.fire('📋 Analysis Results (Select All to Copy) 📋\\n'));
  
  console.log(chalk.yellow('='.repeat(60)));
  console.log(chalk.cyan('DATAPILOT ANALYSIS RESULTS'));
  console.log(chalk.yellow('='.repeat(60)));
  
  // Format results as selectable text
  let output = '';
  if (typeof result === 'string') {
    output = result;
  } else if (result && typeof result === 'object') {
    output = JSON.stringify(result, null, 2);
  } else {
    output = 'Analysis results not available in the expected format.';
  }
  
  // Display the results without colors for easy copying
  console.log(output);
  
  console.log(chalk.yellow('='.repeat(60)));
  console.log(chalk.green('📋 Use Cmd+A (Mac) or Ctrl+A (Windows) to select all text above'));
  console.log(chalk.green('📋 Then Cmd+C (Mac) or Ctrl+C (Windows) to copy'));
  console.log(chalk.yellow('='.repeat(60)));
  
  await prompt({
    type: 'confirm',
    name: 'continue',
    message: 'Done copying? Continue?',
    initial: true
  });
}

// Learning mode and file explorer removed - focusing on core functionality

async function runDemo() {
  console.clear();
  console.log(gradients.sunset('🎭 Demo Mode 🎭\\n'));
  
  const demoChoice = await prompt({
    type: 'select',
    name: 'demo',
    message: 'Choose a demo to run:',
    choices: [
      { name: 'sales', message: '💰 Sales Data Demo' },
      { name: 'ecommerce', message: '🛒 E-commerce Demo' },
      { name: 'survey', message: '📋 Survey Data Demo' },
      { name: 'back', message: '← Back to main menu' }
    ]
  });
  
  if (demoChoice.demo === 'back') return;
  
  // Run demo with built-in test data
  const testFile = `tests/fixtures/test_sales.csv`;
  
  if (fs.existsSync(testFile)) {
    console.log(gradients.fire('\\n🎪 Running demo with sample data! 🎪\\n'));
    await runAnalysisWithAnimation(testFile, 'complete');
    await showResults();
  } else {
    console.log('Demo files not found. Please ensure test fixtures are available.');
  }
}

async function showGoodbyeAnimation() {
  console.clear();
  
  const goodbye = `
  _____ _                 _      __   __           _ 
 |_   _| |__   __ _ _ __ | | __  \\ \\ / /__  _   _| |
   | | | '_ \\ / _\` | '_ \\| |/ /   \\ V / _ \\| | | | |
   | | | | | | (_| | | | |   <     | | (_) | |_| |_|
   |_| |_| |_|\\__,_|_| |_|_|\\_\\    |_|\\___/ \\__,_(_)
    `;
  
  console.log(gradients.rainbow(goodbye));
  
  const thankYouBox = boxen(
    gradients.cosmic('🎉 Thanks for using DataPilot! 🎉\\n\\n') +
    '✨ Hope you discovered amazing insights!\\n' +
    '📊 Your data has stories to tell\\n' +
    '🚀 Keep exploring and analyzing\\n' +
    '💫 See you next time!',
    {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: 'magenta'
    }
  );
  
  console.log(thankYouBox);
  await sleep(2000);
}

// Utility functions
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatFileSize(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function formatPreviewTable(records, columns) {
  if (records.length === 0) return 'No data to preview';
  
  // Simple table formatting for preview
  let table = '';
  
  // Headers
  table += columns.slice(0, 4).join(' | ') + '\\n';
  table += columns.slice(0, 4).map(() => '---').join(' | ') + '\\n';
  
  // Data rows
  records.slice(0, 3).forEach(record => {
    const row = columns.slice(0, 4).map(col => {
      const value = record[col];
      return String(value || '').slice(0, 10);
    });
    table += row.join(' | ') + '\\n';
  });
  
  if (columns.length > 4) {
    table += `\\n... and ${columns.length - 4} more columns`;
  }
  
  return table;
}

// Enhanced CSV Discovery Functions
async function discoverCSVFiles(directory = process.cwd()) {
  try {
    const items = await fs.promises.readdir(directory, { withFileTypes: true });
    const csvFiles = items
      .filter(item => item.isFile() && item.name.endsWith('.csv'))
      .map(file => path.join(directory, file.name));
    
    // Also check common data directories
    const commonDataDirs = ['data', 'csv', 'datasets', 'files'];
    for (const dir of commonDataDirs) {
      const dirPath = path.join(directory, dir);
      try {
        const dataDirItems = await fs.promises.readdir(dirPath, { withFileTypes: true });
        const dataCsvFiles = dataDirItems
          .filter(item => item.isFile() && item.name.endsWith('.csv'))
          .map(file => path.join(dirPath, file.name));
        csvFiles.push(...dataCsvFiles);
      } catch (error) {
        // Directory doesn't exist, continue
      }
    }
    
    return csvFiles;
  } catch (error) {
    return [];
  }
}

async function selectFromDiscovered(files) {
  if (files.length === 0) return null;
  
  console.log(gradients.cyan('\\n🎯 Discovered CSV Files 🎯\\n'));
  
  // Show file previews
  const choices = [];
  for (const file of files) {
    try {
      const stats = await fs.promises.stat(file);
      const sizeStr = formatFileSize(stats.size);
      choices.push({
        name: file,
        message: `📊 ${path.basename(file)} (${sizeStr})`,
        hint: `Location: ${path.dirname(file)}`
      });
    } catch (error) {
      choices.push({
        name: file,
        message: `📊 ${path.basename(file)}`,
        hint: 'File info unavailable'
      });
    }
  }
  
  choices.push({ name: 'back', message: '← Back to file selection' });
  
  const response = await prompt({
    type: 'select',
    name: 'file',
    message: 'Select a CSV file to analyze:',
    choices
  });
  
  return response.file === 'back' ? null : response.file;
}

async function workspaceMode(discoveredFiles) {
  console.log(gradients.rainbow('\\n🏢 Workspace Mode 🏢\\n'));
  console.log('Analyze multiple CSV files together and detect relationships\\n');
  
  if (discoveredFiles.length === 0) {
    console.log(gradients.yellow('No CSV files found in current directory.'));
    console.log('Please navigate to a directory with CSV files or use browse mode.\\n');
    await prompt({ type: 'confirm', name: 'continue', message: 'Press Enter to continue...' });
    return null;
  }
  
  // Show workspace summary
  const totalSize = await calculateTotalSize(discoveredFiles);
  console.log(boxen(
    `📁 Found ${discoveredFiles.length} CSV files\\n` +
    `📊 Total size: ${formatFileSize(totalSize)}\\n` +
    `🔍 Ready for batch analysis`,
    { padding: 1, borderColor: 'cyan' }
  ));
  
  const action = await prompt({
    type: 'select',
    name: 'action',
    message: 'What would you like to do?',
    choices: [
      { name: 'analyze-all', message: '🚀 Analyze all files (EDA + INT + VIS)' },
      { name: 'custom', message: '⚙️ Custom analysis selection' },
      { name: 'relationships', message: '🔗 Detect relationships between files' },
      { name: 'individual', message: '👆 Select individual file' },
      { name: 'back', message: '← Back to file selection' }
    ]
  });
  
  switch (action.action) {
    case 'analyze-all':
      return await batchAnalyzeFiles(discoveredFiles, ['eda', 'int', 'vis']);
    case 'custom':
      return await customBatchAnalysis(discoveredFiles);
    case 'relationships':
      return await analyzeRelationships(discoveredFiles);
    case 'individual':
      return await selectFromDiscovered(discoveredFiles);
    case 'back':
      return null;
  }
}

async function batchAnalyzeFiles(files, analysisTypes) {
  console.log(gradients.fire('\\n🔥 Starting Batch Analysis 🔥\\n'));
  
  const results = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`\\n📊 Analyzing file ${i + 1}/${files.length}: ${path.basename(file)}`);
    
    try {
      // Parse CSV first
      const data = await parseCSV(file);
      const headers = Object.keys(data[0] || {});
      
      // Run selected analyses
      for (const analysisType of analysisTypes) {
        console.log(`  🔍 Running ${analysisType.toUpperCase()} analysis...`);
        
        let analysisResult;
        switch (analysisType) {
          case 'eda':
            analysisResult = await eda(file, { preloadedData: { records: data, columnTypes: detectColumnTypes(data) } });
            break;
          case 'int':
            analysisResult = await integrity(file, { preloadedData: { records: data, columnTypes: detectColumnTypes(data) } });
            break;
          case 'vis':
            analysisResult = await visualize(file, { preloadedData: { records: data, columnTypes: detectColumnTypes(data) } });
            break;
          case 'llm':
            analysisResult = await llmContext(file, { preloadedData: { records: data, columnTypes: detectColumnTypes(data) } });
            break;
        }
        
        results.push({
          file: path.basename(file),
          analysis: analysisType,
          result: analysisResult
        });
      }
    } catch (error) {
      console.log(`  ❌ Error analyzing ${path.basename(file)}: ${error.message}`);
      results.push({
        file: path.basename(file),
        error: error.message
      });
    }
  }
  
  // Show batch summary
  await showBatchSummary(results);
  return 'batch-complete';
}

async function customBatchAnalysis(files) {
  const analysisChoices = await prompt({
    type: 'multiselect',
    name: 'analyses',
    message: 'Select analyses to run on all files:',
    choices: [
      { name: 'eda', message: '📊 Exploratory Data Analysis' },
      { name: 'int', message: '🔍 Data Integrity Check' },
      { name: 'vis', message: '📈 Visualization Recommendations' },
      { name: 'llm', message: '🤖 LLM Context Generation' }
    ]
  });
  
  if (analysisChoices.analyses.length === 0) {
    console.log(gradients.yellow('No analyses selected.'));
    return null;
  }
  
  return await batchAnalyzeFiles(files, analysisChoices.analyses);
}

async function analyzeRelationships(files) {
  console.log(gradients.cosmic('\\n🔗 Analyzing File Relationships 🔗\\n'));
  
  // Simple relationship analysis based on column names
  const relationships = [];
  const fileSchemas = [];
  
  for (const file of files) {
    try {
      const data = await parseCSV(file);
      const headers = Object.keys(data[0] || {});
      const columnTypes = detectColumnTypes(data);
      fileSchemas.push({
        file: path.basename(file),
        headers,
        types: columnTypes,
        sampleData: data.slice(0, 5)
      });
    } catch (error) {
      console.log(`❌ Could not analyze ${path.basename(file)}: ${error.message}`);
    }
  }
  
  // Find potential relationships
  for (let i = 0; i < fileSchemas.length; i++) {
    for (let j = i + 1; j < fileSchemas.length; j++) {
      const schema1 = fileSchemas[i];
      const schema2 = fileSchemas[j];
      
      // Find common columns
      const commonColumns = schema1.headers.filter(h => schema2.headers.includes(h));
      if (commonColumns.length > 0) {
        relationships.push({
          file1: schema1.file,
          file2: schema2.file,
          commonColumns,
          relationshipType: 'shared_columns'
        });
      }
    }
  }
  
  // Display relationship analysis
  console.log(boxen(
    `🔍 Relationship Analysis Results\\n\\n` +
    `📁 Files analyzed: ${fileSchemas.length}\\n` +
    `🔗 Relationships found: ${relationships.length}`,
    { padding: 1, borderColor: 'magenta' }
  ));
  
  if (relationships.length > 0) {
    console.log('\\n🔗 Detected Relationships:');
    relationships.forEach(rel => {
      console.log(`  📊 ${rel.file1} ↔ ${rel.file2}`);
      console.log(`     Common columns: ${rel.commonColumns.join(', ')}`);
    });
  } else {
    console.log('\\n📊 No obvious relationships detected between files.');
  }
  
  await prompt({ type: 'confirm', name: 'continue', message: '\\nPress Enter to continue...' });
  return null;
}

async function showBatchSummary(results) {
  console.log(gradients.rainbow('\\n🏁 Batch Analysis Complete! 🏁\\n'));
  
  const successful = results.filter(r => !r.error);
  const failed = results.filter(r => r.error);
  
  console.log(boxen(
    `✅ Successful analyses: ${successful.length}\\n` +
    `❌ Failed analyses: ${failed.length}\\n` +
    `📊 Total files processed: ${results.length}`,
    { padding: 1, borderColor: 'green' }
  ));
  
  if (failed.length > 0) {
    console.log('\\n❌ Failed Files:');
    failed.forEach(f => {
      console.log(`  📄 ${f.file}: ${f.error}`);
    });
  }
  
  // Always offer save first
  const wantToSave = await prompt({
    type: 'confirm',
    name: 'save',
    message: '💾 Would you like to save batch analysis results?',
    initial: true
  });
  
  if (wantToSave.save) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = `batch-analysis-${timestamp}.txt`;
    
    let output = '# DataPilot Batch Analysis Results\\n\\n';
    results.forEach(r => {
      output += `## ${r.file}\\n`;
      if (r.error) {
        output += `Error: ${r.error}\\n\\n`;
      } else {
        output += `Analysis: ${r.analysis}\\n`;
        output += r.result + '\\n\\n';
      }
    });
    
    await fs.promises.writeFile(outputFile, output);
    console.log(gradients.green(`\\n💾 Results saved to: ${outputFile}`));
  }
  
  await prompt({ type: 'confirm', name: 'continue', message: '\\nPress Enter to continue...' });
}

// Additional utility functions
async function calculateTotalSize(files) {
  let total = 0;
  for (const file of files) {
    try {
      const stats = await fs.promises.stat(file);
      total += stats.size;
    } catch (error) {
      // File might not exist, skip
    }
  }
  return total;
}

// Export already done above with function declaration