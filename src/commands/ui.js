/**
 * Interactive Terminal UI Command - Refactored with TUI Engine
 * Fun, colorful, beginner-friendly interface with animations
 * Now separated into logic (TUI_Engine) and rendering (this file)
 */

import enquirer from 'enquirer';
const { prompt } = enquirer;
import boxen from 'boxen';
import { createSpinner } from 'nanospinner';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

import { TUIEngine } from './tuiEngine.js';

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

// Create comprehensive color object with ALL needed functions
const gradients = {
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
  purple: (text) => chalk.magenta(text),
  gray: (text) => chalk.gray(text),
  grey: (text) => chalk.gray(text),
  white: (text) => chalk.white(text),
  black: (text) => chalk.black(text)
};

export async function interactiveUI() {
  console.clear();
  
  const engine = new TUIEngine();
  
  try {
    // Welcome animation
    await showWelcomeAnimation();
    
    // Main interactive loop
    let running = true;
    while (running) {
      try {
        const action = await showMainMenu(engine);
        
        if (action === 'exit') {
          running = false;
        } else {
          await handleMainMenuAction(engine, action);
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

async function showMainMenu(engine) {
  const choices = engine.getMainMenuChoices();
  
  const response = await prompt({
    type: 'select',
    name: 'action',
    message: gradients.cyan('🚀 What would you like to do?'),
    choices: choices
  });
  
  return response.action;
}

async function handleMainMenuAction(engine, action) {
  const result = await engine.handleMainMenuAction(action);
  
  switch (result.action) {
    case 'analyze':
      await showGuidedAnalysis(engine, result);
      break;
    case 'demo':
      await showDemo(engine, result);
      break;
    case 'memory':
      await showMemoryManager(engine, result);
      break;
    case 'exit':
      // Exit handled in main loop
      break;
    case 'error':
      console.error(chalk.red('Error:'), result.message);
      break;
  }
}

async function showGuidedAnalysis(engine, analysisResult) {
  console.clear();
  console.log(gradients.ocean('🔍 Guided Analysis Mode 🔍\\n'));
  
  // Step 1: File selection
  const filePath = await selectFile(engine, analysisResult.csvFiles);
  if (!filePath) return;
  
  // Step 2: File preview
  await showFilePreview(engine, filePath);
  
  // Step 3: Analysis type selection
  const analysisType = await selectAnalysisType(engine);
  
  // Step 4: Run analysis with beautiful loading
  await runAnalysisWithAnimation(engine, filePath, analysisType);
  
  // Step 5: Show results
  await showResults();
  
  await prompt({
    type: 'confirm',
    name: 'continue',
    message: '\\nPress Enter to continue...'
  });
}

async function selectFile(engine, csvFiles) {
  const choices = engine.getFileSelectionChoices(csvFiles);
  
  if (choices.length === 0) {
    console.log(chalk.yellow('No CSV files found. Please add some CSV files to your project directory.'));
    return null;
  }
  
  const response = await prompt({
    type: 'select',
    name: 'file',
    message: gradients.green('📂 Select a CSV file to analyze:'),
    choices: choices
  });
  
  if (response.file === 'manual') {
    const manualResponse = await prompt({
      type: 'input',
      name: 'path',
      message: 'Enter the path to your CSV file:',
      validate: (input) => {
        if (!input.trim()) return 'Please enter a file path';
        if (!fs.existsSync(input)) return 'File does not exist';
        if (!input.toLowerCase().endsWith('.csv')) return 'File must be a CSV file';
        return true;
      }
    });
    return manualResponse.path;
  }
  
  return response.file;
}

async function showFilePreview(engine, filePath) {
  const spinner = createSpinner('Loading file preview...').start();
  
  try {
    const preview = await engine.previewFile(filePath);
    spinner.success({ text: 'File preview loaded!' });
    
    if (preview.error) {
      console.log(chalk.red('Error reading file:'), preview.error);
      return;
    }
    
    console.log('\\n' + boxen(
      `📄 File: ${chalk.green(path.basename(filePath))}\\n` +
      `📏 Size: ${chalk.cyan(engine.formatFileSize(preview.size))}\\n` +
      `📊 Rows: ${chalk.yellow(preview.rows.toLocaleString())}\\n` +
      `📋 Columns: ${chalk.blue(preview.columns)}\\n\\n` +
      `🏷️  Column Types:\\n${preview.columnNames.slice(0, 5).map(col => 
        `  • ${col} (${preview.columnTypes[col]?.type || 'unknown'})`
      ).join('\\n')}` +
      (preview.columnNames.length > 5 ? `\\n  ... and ${preview.columnNames.length - 5} more` : ''),
      {
        padding: 1,
        borderColor: 'green',
        title: '📋 File Preview',
        titleAlignment: 'center'
      }
    ));
    
  } catch (error) {
    spinner.error({ text: 'Failed to load preview: ' + error.message });
  }
}

async function selectAnalysisType(engine) {
  const choices = engine.getAnalysisTypeChoices();
  
  const response = await prompt({
    type: 'select',
    name: 'type',
    message: gradients.blue('🔬 What type of analysis would you like?'),
    choices: choices
  });
  
  return response.type;
}

async function runAnalysisWithAnimation(engine, filePath, analysisType) {
  const spinner = createSpinner('Preparing analysis...').start();
  
  try {
    spinner.update({ text: 'Running analysis...' });
    const results = await engine.runAnalysis(filePath, analysisType);
    
    if (results.error) {
      spinner.error({ text: 'Analysis failed: ' + results.error });
    } else {
      spinner.success({ text: 'Analysis complete!' });
      
      // Display basic results info
      console.log('\\n' + boxen(
        `✅ Analysis completed successfully!\\n` +
        `📊 Type: ${chalk.cyan(analysisType.toUpperCase())}\\n` +
        `📄 File: ${chalk.green(path.basename(filePath))}\\n` +
        `⏱️  Time: ${chalk.yellow(new Date(results.timestamp).toLocaleTimeString())}`,
        {
          padding: 1,
          borderColor: 'green',
          title: '🎉 Analysis Results',
          titleAlignment: 'center'
        }
      ));
    }
    
  } catch (error) {
    spinner.error({ text: 'Analysis failed: ' + error.message });
  }
}

async function showDemo(engine, demoResult) {
  console.clear();
  console.log(gradients.fire('🎭 Demo Mode 🎭\\n'));
  
  if (demoResult.datasets.length === 0) {
    console.log(chalk.yellow('No demo datasets found. Please ensure test fixtures are available.'));
    await prompt({ type: 'confirm', name: 'continue', message: 'Press Enter to continue...' });
    return;
  }
  
  const choices = demoResult.datasets.map(dataset => ({
    name: dataset.path,
    message: `📊 ${dataset.name}`,
    hint: dataset.description
  }));
  
  choices.push({
    name: 'back',
    message: '⬅️  Back to Main Menu',
    hint: 'Return to main menu'
  });
  
  const response = await prompt({
    type: 'select',
    name: 'dataset',
    message: gradients.fire('🎯 Choose a demo dataset:'),
    choices: choices
  });
  
  if (response.dataset === 'back') return;
  
  // Run demo analysis
  const analysisType = await selectAnalysisType(engine);
  await runAnalysisWithAnimation(engine, response.dataset, analysisType);
  await showResults();
  
  await prompt({
    type: 'confirm',
    name: 'continue',
    message: '\\nPress Enter to continue...'
  });
}

async function showMemoryManager(engine, memoryResult) {
  console.clear();
  console.log(gradients.ocean('🧠 Memory Manager 🧠\\n'));
  
  // Display summary
  console.log(boxen(
    `📊 Tables Analyzed: ${chalk.cyan(memoryResult.summary.tableCount)}\\n` +
    `🏢 Domains Discovered: ${chalk.green(memoryResult.summary.domainCount)}\\n` +
    `💸 Technical Debt: ${chalk.yellow(memoryResult.summary.totalDebtHours + ' hours')}\\n` +
    `📁 Storage Location: ${chalk.gray(memoryResult.summary.storagePath)}`,
    {
      padding: 1,
      borderColor: 'cyan',
      title: '📈 Knowledge Base Summary',
      titleAlignment: 'center'
    }
  ));
  
  console.log();
  
  let managing = true;
  while (managing) {
    const action = await prompt({
      type: 'select',
      name: 'action',
      message: gradients.cyan('What would you like to do?'),
      choices: [
        { name: 'list', message: '📋 List All Memories', hint: 'View all analyzed tables and domains' },
        { name: 'view', message: '🔍 View Memory Details', hint: 'Inspect a specific table\'s knowledge' },
        { name: 'delete', message: '🗑️  Delete Memory', hint: 'Remove a specific table from knowledge base' },
        { name: 'clear', message: '💣 Clear All Memories', hint: 'Remove all warehouse knowledge (careful!)' },
        { name: 'export', message: '💾 Export Memories', hint: 'Save current knowledge to a file' },
        { name: 'session', message: '⏱️  Session Memories', hint: 'Manage temporary session-based knowledge' },
        { name: 'back', message: '⬅️  Back to Main Menu', hint: 'Return to main menu' }
      ]
    });
    
    switch (action.action) {
      case 'list':
        await showMemoryList(engine);
        break;
      case 'view':
        await showMemoryDetails(engine);
        break;
      case 'delete':
        await deleteMemory(engine);
        break;
      case 'clear':
        await clearAllMemories(engine);
        break;
      case 'export':
        await exportMemories(engine);
        break;
      case 'session':
        await showSessionMemories();
        break;
      case 'back':
        managing = false;
        break;
    }
  }
}

async function showMemoryList(engine) {
  console.clear();
  console.log(gradients.ocean('📋 All Memories\\n'));
  
  const memories = await engine.listMemories();
  
  if (Object.keys(memories).length === 0) {
    console.log(chalk.yellow('No memories found. Analyze some CSV files first!'));
  } else {
    Object.entries(memories).forEach(([domain, tables]) => {
      console.log(chalk.cyan(`\\n🏢 ${domain} Domain:`));
      tables.forEach(table => {
        console.log(`  📊 ${chalk.green(table.name)} - ${table.rows} rows × ${table.columns} cols (Quality: ${table.quality})`);
      });
    });
  }
  
  await prompt({ type: 'confirm', name: 'continue', message: '\\nPress Enter to continue...' });
}

async function showMemoryDetails(engine) {
  // Implementation would be similar to the original but using engine methods
  console.log(chalk.yellow('Memory details feature - implementation in progress...'));
  await prompt({ type: 'confirm', name: 'continue', message: 'Press Enter to continue...' });
}

async function deleteMemory(engine) {
  const memories = await engine.listMemories();
  const allTables = Object.values(memories).flat();
  
  if (allTables.length === 0) {
    console.log(chalk.yellow('No memories to delete!'));
    await prompt({ type: 'confirm', name: 'continue', message: 'Press Enter to continue...' });
    return;
  }
  
  const { tableName } = await prompt({
    type: 'autocomplete',
    name: 'tableName',
    message: 'Select a table to delete:',
    choices: allTables.map(t => t.name)
  });
  
  const { confirm } = await prompt({
    type: 'confirm',
    name: 'confirm',
    message: `Are you sure you want to delete memory for "${tableName}"?`,
    initial: false
  });
  
  if (confirm) {
    const spinner = createSpinner('Deleting memory...').start();
    const result = await engine.deleteMemory(tableName);
    
    if (result.success) {
      spinner.success({ text: result.message });
    } else {
      spinner.error({ text: result.message });
    }
  } else {
    console.log(chalk.gray('Deletion cancelled.'));
  }
  
  await prompt({ type: 'confirm', name: 'continue', message: 'Press Enter to continue...' });
}

async function clearAllMemories(engine) {
  console.log(chalk.red('\\n⚠️  WARNING: This will delete ALL warehouse knowledge!'));
  console.log(chalk.yellow('This action cannot be undone.\\n'));
  
  const { confirmFirst } = await prompt({
    type: 'confirm',
    name: 'confirmFirst',
    message: 'Are you absolutely sure you want to clear all memories?',
    initial: false
  });
  
  if (!confirmFirst) {
    console.log(chalk.gray('Clear operation cancelled.'));
    await prompt({ type: 'confirm', name: 'continue', message: 'Press Enter to continue...' });
    return;
  }
  
  const { confirmSecond } = await prompt({
    type: 'input',
    name: 'confirmSecond',
    message: 'Type "DELETE ALL" to confirm:',
    validate: input => input === 'DELETE ALL' || 'Type exactly "DELETE ALL" to confirm'
  });
  
  if (confirmSecond === 'DELETE ALL') {
    const spinner = createSpinner('Clearing all memories...').start();
    const result = await engine.clearAllMemories();
    
    if (result.success) {
      spinner.success({ text: result.message });
    } else {
      spinner.error({ text: result.message });
    }
  } else {
    console.log(chalk.gray('Clear operation cancelled.'));
  }
  
  await prompt({ type: 'confirm', name: 'continue', message: 'Press Enter to continue...' });
}

async function exportMemories(engine) {
  console.log(chalk.yellow('Export memories feature - implementation in progress...'));
  await prompt({ type: 'confirm', name: 'continue', message: 'Press Enter to continue...' });
}

async function showSessionMemories() {
  console.clear();
  console.log(gradients.ocean('⏱️  Session Memory Manager\\n'));
  console.log(chalk.yellow('Feature coming soon!\\n'));
  console.log('Session memories will allow you to:');
  console.log('  • Create temporary analysis sessions');
  console.log('  • Scope memories to specific directories');
  console.log('  • Quick save/load analysis contexts');
  console.log('  • Share knowledge between team members');
  
  await prompt({ type: 'confirm', name: 'continue', message: 'Press Enter to continue...' });
}

async function showResults() {
  console.log('\\n' + chalk.green('📊 Analysis results displayed above.'));
  console.log(chalk.gray('(In the actual implementation, results would be shown here)'));
}

// Animation functions remain the same
async function showWelcomeAnimation() {
  const title = 'DataPilot Interactive UI';
  console.log('\\n' + gradients.rainbow(title));
  console.log(gradients.cyan('━'.repeat(title.length)));
  console.log(gradients.green('🚀 Welcome to the interactive analysis experience!'));
  console.log(gradients.blue('   Navigate with arrows, select with Enter\\n'));
  
  // Small delay for effect
  await new Promise(resolve => setTimeout(resolve, 500));
}

async function showGoodbyeAnimation() {
  console.log('\\n' + gradients.sunset('👋 Thanks for using DataPilot!'));
  console.log(gradients.ocean('   Happy analyzing! 📊✨\\n'));
}