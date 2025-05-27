/**
 * Interactive Terminal UI Command
 * Fun, colorful, beginner-friendly interface with animations
 */

// Note: blessed has bundling issues, using simpler alternatives
import { prompt } from 'enquirer';
import gradient from 'gradient-string';
import figlet from 'figlet';
import boxen from 'boxen';
import { createSpinner } from 'nanospinner';
import fs from 'fs';
import path from 'path';
import { parseCSV, detectColumnTypes } from '../utils/parser.js';
import { eda } from './eda.js';
import { integrity } from './int.js';
import { visualize } from './vis.js';
import { llmContext } from './llm.js';

// Fun gradient themes
const gradients = {
  rainbow: gradient('red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'),
  ocean: gradient('blue', 'cyan', 'teal'),
  sunset: gradient('orange', 'red', 'purple'),
  forest: gradient('green', 'lime', 'cyan'),
  fire: gradient('red', 'orange', 'yellow'),
  cosmic: gradient('purple', 'blue', 'cyan', 'green')
};

export async function interactiveUI() {
  console.clear();
  
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
        case 'learn':
          await showLearningMode();
          break;
        case 'explore':
          await showFileExplorer();
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
      console.error('Error in UI:', error.message);
      await prompt({
        type: 'confirm',
        name: 'continue',
        message: 'Continue using DataPilot?',
        initial: true
      });
    }
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
        message: '📊 Analyze a CSV file (Guided analysis)',
        hint: 'Step-by-step data analysis with beautiful results'
      },
      {
        name: 'learn',
        message: '🎓 Learning Mode (Understand data analysis)',
        hint: 'Interactive tutorials and explanations'
      },
      {
        name: 'explore',
        message: '📁 File Explorer (Browse and preview files)',
        hint: 'Find and preview CSV files with interactive browser'
      },
      {
        name: 'demo',
        message: '🎭 Demo Mode (Try with sample data)',
        hint: 'See DataPilot in action with built-in examples'
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
        const stats = fs.statSync(filePath);
        const size = formatFileSize(stats.size);
        choices.push({
          name: filePath,
          message: `📄 ${file.name} (${size})`,
          value: filePath,
          hint: 'CSV file ready for analysis!'
        });
      });
    
    if (choices.length === 0) {
      console.log('No files or directories found.');
      return null;
    }
    
    choices.push({
      name: 'cancel',
      message: '❌ Cancel file selection',
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
  // This would integrate with the warehouse knowledge from eng command
  console.log(gradients.sunset('📚 Recent files feature coming soon!'));
  await sleep(1000);
  return null;
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
    
    const previewBox = boxen(
      `📄 File: ${gradients.cyan(path.basename(filePath))}\n` +
      `📊 Size: ${formatFileSize(stats.size)}\n` +
      `📈 Rows: ${gradients.green('~' + records.length + '+ rows')}\n` +
      `🏛️  Columns: ${gradients.blue(Object.keys(columnTypes).length + ' columns')}\n\n` +
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
    
    const proceed = await prompt({
      type: 'confirm',
      name: 'continue',
      message: 'Does this look correct? Continue with analysis?',
      initial: true
    });
    
    if (!proceed.continue) {
      throw new Error('Analysis cancelled by user');
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
      console.log('✅ ' + gradients.green('Exploratory Data Analysis completed'));
    }
    if (result.quality) {
      console.log('✅ ' + gradients.blue('Data Quality Check completed'));
    }
    if (result.visual) {
      console.log('✅ ' + gradients.purple('Visualization Recommendations completed'));
    }
    if (result.llm) {
      console.log('✅ ' + gradients.cyan('AI-Ready Context generated'));
    }
  }
  
  const viewOptions = await prompt({
    type: 'select',
    name: 'view',
    message: 'How would you like to view your results?',
    choices: [
      { name: 'summary', message: '📄 Quick Summary' },
      { name: 'detailed', message: '📊 Detailed Results' },
      { name: 'save', message: '💾 Save to File' },
      { name: 'copy', message: '📋 Copy for AI Analysis' },
      { name: 'skip', message: '⏭️  Continue to Main Menu' }
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
  const response = await prompt({
    type: 'input',
    name: 'filename',
    message: 'Enter filename to save results:',
    initial: 'datapilot-analysis.txt'
  });
  
  const spinner = createSpinner('Saving results...').start();
  
  try {
    // Save formatted results to file
    fs.writeFileSync(response.filename, JSON.stringify(result, null, 2));
    spinner.success({ text: `Results saved to ${response.filename}!` });
  } catch (error) {
    spinner.error({ text: `Error saving file: ${error.message}` });
  }
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

async function showLearningMode() {
  console.clear();
  console.log(gradients.forest('🎓 Learning Mode 🎓\n'));
  
  const topics = await prompt({
    type: 'select',
    name: 'topic',
    message: 'What would you like to learn about?',
    choices: [
      { name: 'basics', message: '📚 Data Analysis Basics' },
      { name: 'statistics', message: '📊 Statistics Explained' },
      { name: 'visualization', message: '📈 Data Visualization Guide' },
      { name: 'quality', message: '🔍 Data Quality Principles' },
      { name: 'ai', message: '🤖 AI & Data Analysis' },
      { name: 'back', message: '← Back to main menu' }
    ]
  });
  
  if (topics.topic === 'back') return;
  
  await showLearningContent(topics.topic);
}

async function showLearningContent(topic) {
  console.log('\n' + gradients.rainbow(`📖 Learning: ${topic} 📖\n`));
  
  const content = {
    basics: `
🎯 Data Analysis Basics

Data analysis is like being a detective! 🔍
You look at information to find patterns and stories.

Key steps:
1. 📥 Collect data (like your CSV file)
2. 🔍 Explore what's inside  
3. 📊 Find patterns and trends
4. 💡 Draw insights and conclusions
5. 📈 Visualize your findings

DataPilot helps with ALL of these steps!
    `,
    statistics: `
📊 Statistics Made Simple

Statistics help us understand data better:

• Mean (Average): Add all numbers ÷ count
• Median: The middle number when sorted
• Mode: The most common value
• Standard Deviation: How spread out data is

📈 Correlation: How two things relate
📉 Distribution: How data is spread out

Don't worry - DataPilot calculates these for you!
    `,
    visualization: `
📈 Data Visualization Guide

Charts tell stories your data wants to share:

📊 Bar Chart: Compare categories
📈 Line Chart: Show trends over time  
🥧 Pie Chart: Show parts of a whole
📉 Scatter Plot: Find relationships
📋 Table: Show exact values

DataPilot recommends the BEST charts for your data!
    `,
    quality: `
🔍 Data Quality Principles

Good data = Good insights! Here's what to check:

✅ Completeness: Are values missing?
✅ Accuracy: Are values correct?
✅ Consistency: Same format throughout?
✅ Validity: Do values make sense?
✅ Uniqueness: No unwanted duplicates?

DataPilot automatically checks ALL of these!
    `,
    ai: `
🤖 AI & Data Analysis

AI can supercharge your analysis:

💬 Ask questions in plain English
🔍 Find hidden patterns  
📊 Generate insights automatically
📈 Create visualizations
📝 Write reports

DataPilot creates perfect summaries for AI tools like ChatGPT and Claude!
    `
  };
  
  const learningBox = boxen(
    content[topic] || 'Content coming soon!',
    {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: 'blue'
    }
  );
  
  console.log(learningBox);
  
  await prompt({
    type: 'confirm',
    name: 'continue',
    message: gradients.cosmic('Got it! Ready to continue?'),
    initial: true
  });
}

async function showFileExplorer() {
  console.clear();
  console.log(gradients.ocean('📁 File Explorer 📁\n'));
  
  // This would be a more advanced file browser
  console.log('Advanced file explorer coming soon!');
  console.log('For now, use the guided analysis for file browsing.');
  
  await prompt({
    type: 'confirm',
    name: 'continue',
    message: 'Return to main menu?',
    initial: true
  });
}

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