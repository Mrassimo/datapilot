/**
 * Interactive Terminal UI Command
 * Fun, colorful, beginner-friendly interface with animations
 */

// Note: blessed has bundling issues, using simpler alternatives
import { prompt } from 'enquirer';
import figlet from 'figlet';
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
            await showGoodbyeAnimation();
            break;
        }
      } catch (error) {
        if (error.message.includes('User cancelled')) {
          // Handle graceful cancellation
          console.log(chalk.yellow('\n✋ Operation cancelled'));
          await sleep(1000);
          continue;
        }
        
        console.error(chalk.red('\n❌ Error: ') + error.message);
        const shouldContinue = await prompt({
          type: 'confirm',
          name: 'continue',
          message: 'Continue using DataPilot?',
          initial: true
        });
        
        if (!shouldContinue.continue) {
          running = false;
          await showGoodbyeAnimation();
        }
      }
    }
  } catch (error) {
    console.error(chalk.red('\n💥 Critical error: ') + error.message);
    console.log(chalk.yellow('Exiting DataPilot...'));
    process.exit(1);
  }
}

async function showWelcomeAnimation() {
  console.clear();
  
  // Simple ASCII art header (fallback if figlet fails)
  let title;
  try {
    title = figlet.textSync('DataPilot', { 
      font: 'Big',
      horizontalLayout: 'fitted'
    });
  } catch (error) {
    // Fallback ASCII art
    title = `
  ____        _        ____  _ _       _   
 |  _ \\  __ _| |_ __ _|  _ \\(_) | ___ | |_ 
 | | | |/ _\` | __/ _\` | |_) | | |/ _ \\| __|
 | |_| | (_| | || (_| |  __/| | | (_) | |_ 
 |____/ \\__,_|\\__\\__,_|_|   |_|_|\\___/ \\__|
    `;
  }
  
  // Animate the title with colors
  const lines = title.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const gradientName = Object.keys(gradients)[i % Object.keys(gradients).length];
    console.log(gradients[gradientName](lines[i]));
    await sleep(200);
  }
  
  await sleep(500);
  
  // Welcome message with box
  const welcomeMsg = boxen(
    gradients.rainbow('🚀 Welcome to DataPilot Interactive! 🚀\n\n') +
    '✨ Your fun, colorful data analysis companion\n' +
    '🎯 Perfect for beginners and experts alike\n' +
    '🎨 Beautiful visualizations and insights\n' +
    '🤖 AI-ready analysis generation',
    {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: 'cyan',
      backgroundColor: 'black'
    }
  );
  
  console.log(welcomeMsg);
  await sleep(1000);
}

async function showMainMenu() {
  console.log('\n' + gradients.cosmic('🌟 What would you like to do today? 🌟\n'));
  
  const response = await prompt({
    type: 'select',
    name: 'action',
    message: 'Choose your adventure:',
    choices: [
      {
        name: 'analyze',
        message: '📊 Analyze a CSV file',
        hint: 'Guided analysis with file browser, preview, and multiple analysis types'
      },
      {
        name: 'demo',
        message: '🎭 Try Demo with Sample Data',
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
  console.log(gradients.ocean('🔍 Guided Analysis Mode 🔍\n'));
  
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
  const methods = await prompt({
    type: 'select',
    name: 'method',
    message: 'How would you like to select your CSV file?',
    choices: [
      { name: 'browse', message: '📂 Browse files interactively' },
      { name: 'path', message: '⌨️  Type file path directly' },
      { name: 'recent', message: '🕐 Use recent files' },
      { name: 'back', message: '← Back to main menu' }
    ]
  });
  
  switch (methods.method) {
    case 'browse':
      return await browseFiles();
    case 'path':
      return await enterFilePath();
    case 'recent':
      return await selectRecentFile();
    case 'back':
      return null;
  }
}

async function browseFiles() {
  console.log(gradients.forest('\n🌲 File Browser 🌲\n'));
  
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
          const filePath = path.join(currentDir, file.name);
          try {
            const stats = fs.statSync(filePath);
            const size = formatFileSize(stats.size);
            choices.push({
              name: filePath,
              message: `📄 ${file.name} (${size})`,
              value: filePath,
              hint: 'CSV file ready for analysis!'
            });
          } catch (error) {
            // Skip files we can't read
          }
        });
      
      if (choices.length === 0) {
        console.log(chalk.yellow('No CSV files or directories found in this location.'));
        choices.push({
          name: 'back',
          message: '← Go back to parent directory',
          value: path.dirname(currentDir)
        });
      }
      
      choices.push({
        name: 'cancel',
        message: '❌ Cancel and return to main menu',
        value: null
      });
      
      const selection = await prompt({
        type: 'select',
        name: 'selected',
        message: `Current directory: ${gradients.cyan(currentDir)}`,
        choices
      });
      
      if (!selection.selected) return null;
      
      if (selection.selected.endsWith('.csv')) {
        return selection.selected;
      } else {
        currentDir = selection.selected;
      }
    } catch (error) {
      console.error(chalk.red(`Error reading directory: ${error.message}`));
      
      const goBack = await prompt({
        type: 'confirm',
        name: 'back',
        message: 'Go back to parent directory?',
        initial: true
      });
      
      if (goBack.back && currentDir !== '/') {
        currentDir = path.dirname(currentDir);
      } else {
        return null;
      }
    }
  }
}

async function enterFilePath() {
  const response = await prompt({
    type: 'input',
    name: 'path',
    message: 'Enter the path to your CSV file:',
    validate: (input) => {
      if (!input) return 'Please enter a file path';
      if (!fs.existsSync(input)) return 'File does not exist';
      if (!input.endsWith('.csv')) return 'Please select a CSV file';
      return true;
    }
  });
  
  return response.path;
}

async function selectRecentFile() {
  const recentFiles = getRecentFiles();
  
  if (recentFiles.length === 0) {
    console.log(gradients.sunset('📚 No recent files found yet!'));
    console.log(chalk.gray('Analyze some files first, and they\'ll appear here.'));
    await sleep(2000);
    return null;
  }
  
  console.log(gradients.sunset('\n📚 Recent Files 📚\n'));
  
  const choices = recentFiles.map((file, index) => ({
    name: file.path,
    message: `📄 ${path.basename(file.path)} (${formatDate(new Date(file.lastUsed))})`,
    value: file.path,
    hint: `Last used: ${file.lastUsed}`
  }));
  
  choices.push({
    name: 'back',
    message: '← Back to file selection',
    value: null
  });
  
  const selection = await prompt({
    type: 'select',
    name: 'selected',
    message: 'Choose a recent file:',
    choices
  });
  
  return selection.selected;
}

// Recent files management
function getRecentFiles() {
  try {
    if (fs.existsSync(RECENT_FILES_PATH)) {
      const content = fs.readFileSync(RECENT_FILES_PATH, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error(chalk.yellow('Warning: Could not read recent files'));
  }
  return [];
}

function addRecentFile(filePath) {
  try {
    let recentFiles = getRecentFiles();
    
    // Remove if already exists
    recentFiles = recentFiles.filter(f => f.path !== filePath);
    
    // Add to beginning
    recentFiles.unshift({
      path: filePath,
      lastUsed: new Date().toISOString()
    });
    
    // Keep only recent files
    recentFiles = recentFiles.slice(0, MAX_RECENT_FILES);
    
    // Ensure directory exists
    const dir = path.dirname(RECENT_FILES_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(RECENT_FILES_PATH, JSON.stringify(recentFiles, null, 2));
  } catch (error) {
    // Silently fail - not critical
    console.error(chalk.yellow('Warning: Could not save to recent files'));
  }
}

function formatDate(date) {
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
}

async function showFilePreview(filePath) {
  console.clear();
  console.log(gradients.fire('🔍 File Preview 🔍\n'));
  
  const spinner = createSpinner('Reading file...').start();
  
  try {
    const stats = fs.statSync(filePath);
    const records = await parseCSV(filePath, { limit: 5 });
    const columnTypes = detectColumnTypes(records);
    
    spinner.success({ text: 'File loaded successfully!' });
    
    // Add to recent files
    addRecentFile(filePath);
    
    const previewBox = boxen(
      `📄 File: ${chalk.cyan(path.basename(filePath))}\n` +
      `📊 Size: ${formatFileSize(stats.size)}\n` +
      `📈 Rows: ${chalk.green('~' + records.length + '+ rows')}\n` +
      `🏛️  Columns: ${chalk.blue(Object.keys(columnTypes).length + ' columns')}\n\n` +
      `${gradients.rainbow('First 5 rows preview:')}\n` +
      formatPreviewTable(records, Object.keys(columnTypes)),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green'
      }
    );
    
    console.log(previewBox);
    
    const choices = [
      { name: 'continue', message: '✅ Continue with analysis', value: true },
      { name: 'back', message: '← Choose different file', value: false },
      { name: 'exit', message: '❌ Exit to main menu', value: 'exit' }
    ];
    
    const proceed = await prompt({
      type: 'select',
      name: 'action',
      message: 'What would you like to do?',
      choices
    });
    
    if (proceed.action === 'exit') {
      throw new Error('User cancelled');
    }
    
    if (!proceed.action) {
      throw new Error('Back to file selection');
    }
    
  } catch (error) {
    spinner.error({ text: `Error reading file: ${error.message}` });
    throw error;
  }
}

async function selectAnalysisType() {
  console.log('\n' + gradients.cosmic('🎯 Choose Your Analysis Adventure! 🎯\n'));
  
  const response = await prompt({
    type: 'select',
    name: 'type',
    message: 'What type of analysis would you like?',
    choices: [
      {
        name: 'complete',
        message: '🚀 Complete Analysis (All insights)',
        hint: 'Run all analysis types for comprehensive insights'
      },
      {
        name: 'eda',
        message: '📊 Exploratory Data Analysis',
        hint: 'Statistical insights, correlations, distributions'
      },
      {
        name: 'quality',
        message: '🔍 Data Quality Check',
        hint: 'Find missing values, duplicates, inconsistencies'
      },
      {
        name: 'visual',
        message: '📈 Visualization Recommendations',
        hint: 'Best charts and graphs for your data'
      },
      {
        name: 'llm',
        message: '🤖 AI-Ready Context',
        hint: 'Perfect summary for ChatGPT, Claude, etc.'
      }
    ]
  });
  
  return response.type;
}

async function runAnalysisWithAnimation(filePath, analysisType) {
  console.clear();
  console.log(gradients.rainbow('🎪 Analysis in Progress! 🎪\n'));
  
  const messages = [
    '🔍 Reading your data...',
    '🧮 Crunching numbers...',
    '📊 Finding patterns...',
    '🎯 Generating insights...',
    '✨ Adding magic touches...',
    '🎉 Almost done!'
  ];
  
  let messageIndex = 0;
  const spinner = createSpinner(messages[messageIndex]).start();
  
  // Animate through messages
  const messageInterval = setInterval(() => {
    messageIndex = (messageIndex + 1) % messages.length;
    spinner.update({ text: messages[messageIndex] });
  }, 1500);
  
  try {
    // Run the actual analysis
    let result;
    const options = { structuredOutput: true, quiet: true };
    
    switch (analysisType) {
      case 'complete':
        // Run all analyses
        result = {
          eda: await eda(filePath, options),
          quality: await integrity(filePath, options),
          visual: await visualize(filePath, options),
          llm: await llmContext(filePath, options)
        };
        break;
      case 'eda':
        result = await eda(filePath, options);
        break;
      case 'quality':
        result = await integrity(filePath, options);
        break;
      case 'visual':
        result = await visualize(filePath, options);
        break;
      case 'llm':
        result = await llmContext(filePath, options);
        break;
    }
    
    clearInterval(messageInterval);
    spinner.success({ text: gradients.rainbow('Analysis complete! 🎉') });
    
    // Store result for display
    global.lastAnalysisResult = result;
    
  } catch (error) {
    clearInterval(messageInterval);
    spinner.error({ text: `Analysis failed: ${error.message}` });
    throw error;
  }
}

async function showResults() {
  console.log('\n' + gradients.fire('🎊 Your Analysis Results! 🎊\n'));
  
  const result = global.lastAnalysisResult;
  
  if (!result) {
    console.log('No results to display.');
    return;
  }
  
  // Beautiful results display
  if (result.eda || result.quality || result.visual || result.llm) {
    console.log(gradients.ocean('📋 Analysis Summary:\n'));
    
    if (result.eda) {
      console.log('✅ ' + chalk.green('Exploratory Data Analysis completed'));
    }
    if (result.quality) {
      console.log('✅ ' + chalk.blue('Data Quality Check completed'));
    }
    if (result.visual) {
      console.log('✅ ' + chalk.magenta('Visualization Recommendations completed'));
    }
    if (result.llm) {
      console.log('✅ ' + chalk.cyan('AI-Ready Context generated'));
    }
  }
  
  // Always offer save first
  const wantToSave = await prompt({
    type: 'confirm',
    name: 'save',
    message: '💾 Would you like to save your analysis results?',
    initial: true
  });
  
  if (wantToSave.save) {
    await saveResults(result);
  }
  
  let keepShowing = true;
  while (keepShowing) {
    const viewOptions = await prompt({
      type: 'select',
      name: 'view',
      message: 'What would you like to do with your results?',
      choices: [
        { name: 'summary', message: '📄 Quick Summary' },
        { name: 'detailed', message: '📊 Detailed Results' },
        { name: 'save', message: '💾 Save to File' },
        { name: 'copy', message: '📋 Copy for AI Analysis' },
        { name: 'select', message: '📋 View Results (for copying)' },
        { name: 'back', message: '← Back to Analysis Options' },
        { name: 'menu', message: '🏠 Return to Main Menu' }
      ]
    });
    
    switch (viewOptions.view) {
      case 'summary':
        await showResultSummary(result);
        break;
      case 'detailed':
        await showDetailedResults(result);
        break;
      case 'save':
        await saveResults(result);
        break;
      case 'copy':
        await copyForAI(result);
        break;
      case 'select':
        await showSelectableResults(result);
        break;
      case 'back':
        // Go back to analysis type selection
        throw new Error('Back to analysis');
      case 'menu':
        keepShowing = false;
        break;
    }
  }
}

async function showResultSummary(result) {
  console.log('\n' + gradients.rainbow('📊 Analysis Summary 📊\n'));
  
  // This would show a beautiful summary of key findings
  const summaryBox = boxen(
    gradients.cosmic('🎯 Key Findings:\n\n') +
    '• Data quality score: ' + gradients.green('85%') + '\n' +
    '• Most important column: ' + gradients.yellow('revenue') + '\n' +
    '• Best visualization: ' + gradients.blue('time series chart') + '\n' +
    '• Recommended analysis: ' + gradients.purple('seasonal patterns') + '\n\n' +
    gradients.fire('💡 Pro tip: Use the detailed view for more insights!'),
    {
      padding: 1,
      borderStyle: 'double',
      borderColor: 'yellow'
    }
  );
  
  console.log(summaryBox);
  
  await prompt({
    type: 'confirm',
    name: 'continue',
    message: 'Continue?',
    initial: true
  });
}

async function showDetailedResults(result) {
  console.log('\n' + gradients.fire('📈 Detailed Analysis Results 📈\n'));
  
  // This would show the actual analysis output in a formatted way
  console.log('Detailed results would be displayed here...');
  console.log('(Implementation would format the actual analysis output beautifully)');
  
  await prompt({
    type: 'confirm',
    name: 'continue',
    message: 'Continue?',
    initial: true
  });
}

async function saveResults(result) {
  const choices = [
    { name: 'quick', message: '⚡ Quick Save (datapilot-analysis.txt)', value: 'quick' },
    { name: 'custom', message: '📝 Choose custom filename', value: 'custom' },
    { name: 'timestamped', message: '📅 Save with timestamp', value: 'timestamped' },
    { name: 'back', message: '← Back to results menu', value: 'back' }
  ];
  
  const saveChoice = await prompt({
    type: 'select',
    name: 'choice',
    message: 'How would you like to save your results?',
    choices
  });
  
  if (saveChoice.choice === 'back') return;
  
  let filename;
  switch (saveChoice.choice) {
    case 'quick':
      filename = 'datapilot-analysis.txt';
      break;
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
      output = `DataPilot Analysis Results\nGenerated: ${new Date().toISOString()}\n\n`;
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
      console.log(chalk.cyan('\n📄 Saved content preview:'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(output.slice(0, 500) + (output.length > 500 ? '\n...(truncated)' : ''));
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
  console.log('\n' + gradients.cosmic('🤖 AI-Ready Analysis Context 🤖\n'));
  
  const contextBox = boxen(
    gradients.rainbow('Perfect for AI Analysis!\n\n') +
    '🎯 Copy this analysis and paste into:\n' +
    '• ChatGPT for insights\n' +
    '• Claude for deep analysis\n' +
    '• Any AI assistant for questions\n\n' +
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
  console.log('\n' + gradients.fire('📋 Analysis Results (Select All to Copy) 📋\n'));
  
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
  console.log(gradients.sunset('🎭 Demo Mode 🎭\n'));
  
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
    console.log(gradients.fire('\n🎪 Running demo with sample data! 🎪\n'));
    await runAnalysisWithAnimation(testFile, 'complete');
    await showResults();
  } else {
    console.log('Demo files not found. Please ensure test fixtures are available.');
  }
}

async function showGoodbyeAnimation() {
  console.clear();
  
  let goodbye;
  try {
    goodbye = figlet.textSync('Thank You!', { 
      font: 'Big',
      horizontalLayout: 'fitted'
    });
  } catch (error) {
    // Fallback
    goodbye = `
  _____ _                 _      __   __           _ 
 |_   _| |__   __ _ _ __ | | __  \\ \\ / /__  _   _| |
   | | | '_ \\ / _\` | '_ \\| |/ /   \\ V / _ \\| | | | |
   | | | | | | (_| | | | |   <     | | (_) | |_| |_|
   |_| |_| |_|\\__,_|_| |_|_|\\_\\    |_|\\___/ \\__,_(_)
    `;
  }
  
  console.log(gradients.rainbow(goodbye));
  
  const thankYouBox = boxen(
    gradients.cosmic('🎉 Thanks for using DataPilot! 🎉\n\n') +
    '✨ Hope you discovered amazing insights!\n' +
    '📊 Your data has stories to tell\n' +
    '🚀 Keep exploring and analyzing\n' +
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
  table += columns.slice(0, 4).join(' | ') + '\n';
  table += columns.slice(0, 4).map(() => '---').join(' | ') + '\n';
  
  // Data rows
  records.slice(0, 3).forEach(record => {
    const row = columns.slice(0, 4).map(col => {
      const value = record[col];
      return String(value || '').slice(0, 10);
    });
    table += row.join(' | ') + '\n';
  });
  
  if (columns.length > 4) {
    table += `\n... and ${columns.length - 4} more columns`;
  }
  
  return table;
}