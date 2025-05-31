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

import { TUIEngine } from './engine.js';

// Wrapper for prompts to handle Escape key gracefully
async function safePrompt(config) {
  try {
    return await prompt(config);
  } catch (error) {
    if (error && error.message && (error.message.includes('cancelled') || error.message.includes('Escape'))) {
      throw new Error('cancelled');
    }
    throw error;
  }
}

// Dark-terminal optimized color functions
const safeColors = {
  // Bright colors that work well on dark backgrounds
  primary: (text) => chalk.cyan.bold(text),        // Bright cyan for headings
  secondary: (text) => chalk.white(text),          // White for important text
  accent: (text) => chalk.yellow.bold(text),       // Bold yellow for highlights
  success: (text) => chalk.green.bold(text),       // Bold green for success
  warning: (text) => chalk.yellow(text),           // Yellow for warnings
  danger: (text) => chalk.red.bold(text),          // Bold red for errors
  info: (text) => chalk.blue.bold(text),           // Bold blue for info
  muted: (text) => chalk.gray(text),               // Gray for secondary text
  cyan: (text) => chalk.cyan(text),
  green: (text) => chalk.green.bold(text),
  blue: (text) => chalk.blue.bold(text),
  red: (text) => chalk.red.bold(text),
  yellow: (text) => chalk.yellow.bold(text),
  magenta: (text) => chalk.magenta.bold(text),
  white: (text) => chalk.white(text)
};

// Dark-terminal optimized gradients - no rainbow theme
const gradients = {
  // Remove jarring rainbow, use elegant gradients
  title: (text) => safeColors.primary(text),       // Cyan for titles
  menu: (text) => safeColors.secondary(text),      // White for menu items
  highlight: (text) => safeColors.accent(text),    // Yellow for highlights
  success: (text) => safeColors.success(text),     // Green for success
  warning: (text) => safeColors.warning(text),     // Yellow for warnings
  error: (text) => safeColors.danger(text),        // Red for errors
  info: (text) => safeColors.info(text),           // Blue for info
  subtle: (text) => safeColors.muted(text),        // Gray for subtle text
  accent: (text) => safeColors.accent(text),       // Yellow for accents
  
  // Legacy support (mapped to better colors)
  rainbow: (text) => safeColors.primary(text),     // Replace rainbow with cyan
  ocean: (text) => safeColors.info(text),          // Blue
  sunset: (text) => safeColors.accent(text),       // Yellow
  forest: (text) => safeColors.success(text),      // Green
  fire: (text) => safeColors.danger(text),         // Red
  cosmic: (text) => safeColors.magenta(text),      // Magenta
  cyan: (text) => safeColors.cyan(text),
  green: (text) => safeColors.green(text),
  blue: (text) => safeColors.blue(text),
  red: (text) => safeColors.red(text),
  yellow: (text) => safeColors.yellow(text),
  magenta: (text) => safeColors.magenta(text),
  purple: (text) => safeColors.magenta(text),
  gray: (text) => safeColors.muted(text),
  grey: (text) => safeColors.muted(text),
  white: (text) => safeColors.white(text),
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
        // Handle Escape key press gracefully
        if (error && error.message && error.message.includes('cancelled')) {
          console.log(chalk.yellow('\nOperation cancelled. Returning to main menu...'));
          continue;
        }
        
        console.log(chalk.red('An error occurred:'), error.message);
        try {
          const continueChoice = await safePrompt({
            type: 'confirm',
            name: 'continue',
            message: 'Would you like to continue?',
            initial: true
          });
          
          if (!continueChoice.continue) {
            running = false;
          }
        } catch (continueError) {
          // If user cancels the continue prompt, exit gracefully
          running = false;
        }
      }
    }
    
    // Goodbye animation
    await showGoodbyeAnimation();
    
  } catch (error) {
    console.log(chalk.red('Fatal error in interactive UI:'), error.message);
    process.exit(1);
  }
}

async function showMainMenu(engine) {
  const choices = engine.getMainMenuChoices();
  
  // Clean, professional main menu header
  console.log('\n' + boxen(
    gradients.title('⭐ MAIN MENU ⭐') + '\n' +
    gradients.menu('Choose your data adventure:'),
    {
      padding: { top: 0, bottom: 0, left: 2, right: 2 },
      borderStyle: 'single',
      borderColor: 'cyan',
      textAlignment: 'center'
    }
  ));
  
  const response = await safePrompt({
    type: 'select',
    name: 'action',
    message: gradients.highlight('🚀 What would you like to explore today?'),
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
    case 'settings':
      await showSettings(engine, result);
      break;
    case 'exit':
      // Exit handled in main loop
      break;
    case 'error':
      console.log(chalk.red('Error:'), result.message);
      break;
  }
}

async function showGuidedAnalysis(engine, analysisResult) {
  console.clear();
  
  // Enhanced guided analysis header
  const analysisHeader = `
  ╔═════════════════════════════════════════════════════════════╗
  ║                  🔍 GUIDED ANALYSIS MODE 🔍                 ║
  ║              Transform CSV data into insights                ║
  ╚═════════════════════════════════════════════════════════════╝`;
  
  console.log(gradients.ocean(analysisHeader));
  console.log();
  
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
  
  await safePrompt({
    type: 'confirm',
    name: 'continue',
    message: '\\nPress Enter to continue...'
  });
}

async function browseForFile() {
  let currentPath = process.cwd();
  let selectedFile = null;
  
  while (selectedFile === null) {
    try {
      // Get directory contents
      const items = fs.readdirSync(currentPath).map(item => {
        const fullPath = path.join(currentPath, item);
        const stats = fs.statSync(fullPath);
        const isDirectory = stats.isDirectory();
        const isCSV = item.toLowerCase().endsWith('.csv');
        
        return {
          name: item,
          fullPath,
          isDirectory,
          isCSV,
          size: stats.size,
          modified: stats.mtime
        };
      }).filter(item => item.isDirectory || item.isCSV);
      
      // Sort: directories first, then files
      items.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
      
      // Build choices
      const choices = [];
      
      // Add parent directory option if not at root
      if (currentPath !== '/') {
        choices.push({
          name: '..',
          message: '📁 .. (parent directory)',
          value: { action: 'parent' }
        });
      }
      
      // Add directories
      items.filter(item => item.isDirectory).forEach(item => {
        choices.push({
          name: item.fullPath,
          message: `📁 ${item.name}/`,
          value: { action: 'cd', path: item.fullPath }
        });
      });
      
      // Add CSV files
      items.filter(item => item.isCSV).forEach(item => {
        const sizeStr = item.size < 1024 ? `${item.size}B` :
                       item.size < 1024 * 1024 ? `${(item.size / 1024).toFixed(1)}KB` :
                       `${(item.size / (1024 * 1024)).toFixed(1)}MB`;
        choices.push({
          name: item.fullPath,
          message: `📄 ${item.name} (${sizeStr})`,
          value: { action: 'select', path: item.fullPath }
        });
      });
      
      // Add cancel option
      choices.push({
        name: 'cancel',
        message: '❌ Cancel',
        value: { action: 'cancel' }
      });
      
      // Show current directory
      console.log('\\n' + gradients.info(`📂 Current directory: ${currentPath}`));
      
      const response = await safePrompt({
        type: 'select',
        name: 'selection',
        message: 'Navigate with ↑↓ arrows, Enter to select:',
        choices: choices
      });
      
      // Handle selection
      if (response.selection.action === 'cancel') {
        return null;
      } else if (response.selection.action === 'parent') {
        currentPath = path.dirname(currentPath);
      } else if (response.selection.action === 'cd') {
        currentPath = response.selection.path;
      } else if (response.selection.action === 'select') {
        selectedFile = response.selection.path;
      }
      
    } catch (error) {
      console.log(gradients.error(`❌ Error browsing directory: ${error.message}`));
      return null;
    }
  }
  
  return selectedFile;
}

async function selectFile(engine, csvFiles) {
  const choices = engine.getFileSelectionChoices(csvFiles);
  
  if (choices.length === 0) {
    console.log(chalk.yellow('No CSV files found. Please add some CSV files to your project directory.'));
    return null;
  }
  
  const response = await safePrompt({
    type: 'select',
    name: 'file',
    message: gradients.success('📂 Select a CSV file to analyze:'),
    choices: choices
  });
  
  if (response.file === 'back') {
    return null; // Signal to return to main menu
  }
  
  if (response.file === 'manual') {
    // Interactive file browser
    const selectedFile = await browseForFile();
    return selectedFile;
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
  
  const response = await safePrompt({
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
  
  // Enhanced demo mode header
  const demoHeader = `
  ╔═════════════════════════════════════════════════════════════╗
  ║                     🎭 DEMO MODE 🎭                        ║
  ║               Try DataPilot with sample data                 ║
  ╚═════════════════════════════════════════════════════════════╝`;
  
  console.log(gradients.fire(demoHeader));
  console.log();
  
  if (demoResult.datasets.length === 0) {
    console.log(chalk.yellow('No demo datasets found. Please ensure test fixtures are available.'));
    await safePrompt({ type: 'confirm', name: 'continue', message: 'Press Enter to continue...' });
    return;
  }
  
  // Simple list of 5 curated datasets
  const choices = demoResult.datasets.map(dataset => {
    const categoryIcons = {
      healthcare: '🏥',
      ecommerce: '🛒', 
      real_estate: '🏠',
      ml_classic: '🤖',
      australian: '🇦🇺'
    };
    
    const icon = categoryIcons[dataset.category] || '📊';
    
    return {
      name: dataset.path,
      message: `${icon} ${dataset.name}`,
      hint: `${dataset.size} - ${dataset.description}`
    };
  });
  
  choices.push({
    name: 'back',
    message: '⬅️  Back to Main Menu',
    hint: 'Return to main menu'
  });
  
  const response = await safePrompt({
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
  
  await safePrompt({
    type: 'confirm',
    name: 'continue',
    message: '\\nPress Enter to continue...'
  });
}

async function showMemoryManager(engine, memoryResult) {
  console.clear();
  
  // Enhanced memory manager header
  const memoryHeader = `
  ╔═════════════════════════════════════════════════════════════╗
  ║                   🧠 MEMORY MANAGER 🧠                     ║
  ║              Manage DataPilot's warehouse knowledge         ║
  ╚═════════════════════════════════════════════════════════════╝`;
  
  console.log(gradients.ocean(memoryHeader));
  console.log();
  
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
    const action = await safePrompt({
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
  
  // Enhanced memory list header
  const memoryListHeader = `
  ╔═════════════════════════════════════════════════════════════╗
  ║                   📋 ALL MEMORIES 📋                       ║
  ║                View your analysis history                    ║
  ╚═════════════════════════════════════════════════════════════╝`;
  
  console.log(gradients.ocean(memoryListHeader));
  console.log();
  
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
  
  await safePrompt({ type: 'confirm', name: 'continue', message: '\\nPress Enter to continue...' });
}

async function showMemoryDetails(engine) {
  // Implementation would be similar to the original but using engine methods
  console.log(chalk.yellow('Memory details feature - implementation in progress...'));
  await safePrompt({ type: 'confirm', name: 'continue', message: 'Press Enter to continue...' });
}

async function deleteMemory(engine) {
  const memories = await engine.listMemories();
  const allTables = Object.values(memories).flat();
  
  if (allTables.length === 0) {
    console.log(chalk.yellow('No memories to delete!'));
    await safePrompt({ type: 'confirm', name: 'continue', message: 'Press Enter to continue...' });
    return;
  }
  
  const { tableName } = await safePrompt({
    type: 'autocomplete',
    name: 'tableName',
    message: 'Select a table to delete:',
    choices: allTables.map(t => t.name)
  });
  
  const { confirm } = await safePrompt({
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
  
  await safePrompt({ type: 'confirm', name: 'continue', message: 'Press Enter to continue...' });
}

async function clearAllMemories(engine) {
  console.log(chalk.red('\\n⚠️  WARNING: This will delete ALL warehouse knowledge!'));
  console.log(chalk.yellow('This action cannot be undone.\\n'));
  
  const { confirmFirst } = await safePrompt({
    type: 'confirm',
    name: 'confirmFirst',
    message: 'Are you absolutely sure you want to clear all memories?',
    initial: false
  });
  
  if (!confirmFirst) {
    console.log(chalk.gray('Clear operation cancelled.'));
    await safePrompt({ type: 'confirm', name: 'continue', message: 'Press Enter to continue...' });
    return;
  }
  
  const { confirmSecond } = await safePrompt({
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
  
  await safePrompt({ type: 'confirm', name: 'continue', message: 'Press Enter to continue...' });
}

async function exportMemories(engine) {
  console.clear();
  
  const exportHeader = `
  ╔═════════════════════════════════════════════════════════════╗
  ║                 💾 EXPORT MEMORIES 💾                      ║
  ║               Save warehouse knowledge to file              ║
  ╚═════════════════════════════════════════════════════════════╝`;
  
  console.log(gradients.title(exportHeader));
  
  try {
    // Get all memories from the engine
    const memories = await engine.listMemories();
    
    if (Object.keys(memories).length === 0) {
      console.log(gradients.warning('\n⚠️  No memories found to export. Analyze some CSV files first!'));
      await safePrompt({ type: 'confirm', name: 'continue', message: 'Press Enter to continue...' });
      return;
    }
    
    // Get export filename from user
    const { filename } = await safePrompt({
      type: 'input',
      name: 'filename',
      message: gradients.info('Enter filename for export (without extension):'),
      initial: `datapilot-memories-${new Date().toISOString().split('T')[0]}`,
      validate: (input) => {
        if (!input.trim()) return 'Please enter a filename';
        // Remove invalid filename characters
        const cleaned = input.trim().replace(/[<>:"/\\|?*]/g, '-');
        return cleaned.length > 0 || 'Please enter a valid filename';
      }
    });
    
    // Clean the filename
    const cleanFilename = filename.trim().replace(/[<>:"/\\|?*]/g, '-');
    const exportPath = `${cleanFilename}.txt`;
    
    const spinner = createSpinner('Exporting memories...').start();
    
    // Generate export content
    let exportContent = `DataPilot Warehouse Knowledge Export
Generated: ${new Date().toLocaleString()}
═══════════════════════════════════════════════════════════════

MEMORY SUMMARY
──────────────────────────────────────────────────────────────
Total Domains: ${Object.keys(memories).length}
Total Tables: ${Object.values(memories).reduce((total, tables) => total + tables.length, 0)}

`;

    // Export each domain and its tables
    Object.entries(memories).forEach(([domain, tables]) => {
      exportContent += `\n🏢 ${domain.toUpperCase()} DOMAIN
──────────────────────────────────────────────────────────────
Tables in this domain: ${tables.length}

`;
      
      tables.forEach((table, index) => {
        exportContent += `${index + 1}. ${table.name}
   • Rows: ${table.rows?.toLocaleString() || 'Unknown'}
   • Columns: ${table.columns || 'Unknown'}
   • Quality: ${table.quality || 'N/A'}

`;
      });
    });
    
    // Add detailed warehouse knowledge if available
    try {
      const detailedKnowledge = await engine.getDetailedKnowledge();
      if (detailedKnowledge) {
        exportContent += `\nDETAILED WAREHOUSE KNOWLEDGE
──────────────────────────────────────────────────────────────
${detailedKnowledge}

`;
      }
    } catch (error) {
      // Continue without detailed knowledge if not available
    }
    
    exportContent += `\nExport completed at ${new Date().toLocaleString()}
Generated by DataPilot - Your Data Analysis Co-Pilot 🛩️
`;
    
    // Write to file
    fs.writeFileSync(exportPath, exportContent, 'utf8');
    
    spinner.succeed('Memories exported successfully!');
    
    console.log('\n' + boxen(
      gradients.success(`✅ Export Complete!\n\n`) +
      gradients.info(`📁 File saved as: ${exportPath}\n`) +
      gradients.info(`📊 Exported ${Object.keys(memories).length} domains with ${Object.values(memories).reduce((total, tables) => total + tables.length, 0)} tables\n`) +
      gradients.subtle(`💡 You can now share this file or use it for documentation`),
      {
        padding: 1,
        borderColor: 'green',
        title: '💾 Export Summary',
        titleAlignment: 'center'
      }
    ));
    
  } catch (error) {
    console.log(gradients.error(`\n❌ Export failed: ${error.message}`));
  }
  
  await safePrompt({ type: 'confirm', name: 'continue', message: '\nPress Enter to continue...' });
}

async function showSessionMemories() {
  console.clear();
  
  // Enhanced session memories header
  const sessionHeader = `
  ╔═════════════════════════════════════════════════════════════╗
  ║                ⏱️  SESSION MEMORY MANAGER ⏱️                ║
  ║              Temporary analysis contexts (Coming Soon!)      ║
  ╚═════════════════════════════════════════════════════════════╝`;
  
  console.log(gradients.ocean(sessionHeader));
  
  console.log('\\n' + boxen(
    gradients.yellow('🚧 Feature Under Development 🚧\\n\\n') +
    'Session memories will enable:\\n' +
    gradients.green('• 📁 Temporary analysis sessions\\n') +
    gradients.blue('• 🎯 Directory-scoped memories\\n') +
    gradients.cyan('• ⚡ Quick save/load contexts\\n') +
    gradients.magenta('• 🤝 Team knowledge sharing'),
    {
      padding: 1,
      borderStyle: 'round',
      borderColor: 'yellow',
      title: '🔮 Coming Soon',
      titleAlignment: 'center'
    }
  ));
  console.log();
  console.log('Session memories will allow you to:');
  console.log('  • Create temporary analysis sessions');
  console.log('  • Scope memories to specific directories');
  console.log('  • Quick save/load analysis contexts');
  console.log('  • Share knowledge between team members');
  
  await safePrompt({ type: 'confirm', name: 'continue', message: 'Press Enter to continue...' });
}

async function showResults() {
  console.log('\\n' + chalk.green('📊 Analysis results displayed above.'));
  console.log(chalk.gray('(In the actual implementation, results would be shown here)'));
}

// Clean animation functions with proper ASCII art
async function showWelcomeAnimation() {
  // Clear screen and show clean DataPilot ASCII art
  console.clear();
  
  const logo = `
  ██████╗  █████╗ ████████╗ █████╗ ██████╗ ██╗██╗      ██████╗ ████████╗
  ██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗██╔══██╗██║██║     ██╔═══██╗╚══██╔══╝
  ██║  ██║███████║   ██║   ███████║██████╔╝██║██║     ██║   ██║   ██║   
  ██║  ██║██╔══██║   ██║   ██╔══██║██╔═══╝ ██║██║     ██║   ██║   ██║   
  ██████╔╝██║  ██║   ██║   ██║  ██║██║     ██║███████╗╚██████╔╝   ██║   
  ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝ ╚═════╝    ╚═╝   
                      🛩️ Your Data Analysis Co-Pilot 🛩️`;

  console.log(gradients.title(logo));
  
  // Clean welcome message with better styling and proper borders
  console.log('\n' + boxen(
    gradients.title('✨ Welcome to DataPilot Interactive Terminal UI! ✨') + '\n\n' +
    gradients.success('🎯 Perfect for beginners and experts alike') + '\n' +
    gradients.info('🎨 Beautiful insights and visualizations') + '\n' +
    gradients.highlight('🤖 AI-ready analysis generation') + '\n' +
    gradients.accent('🚀 Zero installation, maximum insights') + '\n\n' +
    gradients.subtle('Navigate: ↑↓ arrows | Select: Enter | Exit: Ctrl+C'),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'single',
      borderColor: 'cyan',
      title: '⭐ Interactive Data Analysis Engine ⭐',
      titleAlignment: 'center'
    }
  ));
  
  // Animated loading effect - removed artificial delay
  const spinner = createSpinner('Initializing DataPilot...').start();
  spinner.success({ text: 'Ready to analyze your data! 🎉' });
  
  console.log();
}

async function showGoodbyeAnimation() {
  console.clear();
  
  const farewellArt = `
  ╔══════════════════════════════════════════════════════════════╗
  ║                    🛩️ DataPilot Signing Off 🛩️                ║
  ╚══════════════════════════════════════════════════════════════╝`;
  
  console.log(gradients.sunset(farewellArt));
  
  console.log('\n' + boxen(
    gradients.cyan('Thank you for using DataPilot! 🙏') + '\n\n' +
    gradients.green('🎯 Data insights discovered') + '\n' +
    gradients.blue('📊 Knowledge gained') + '\n' +
    gradients.yellow('🚀 Analysis complete') + '\n\n' +
    gradients.ocean('Come back soon for more data adventures! 📈✨'),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'yellow',
      title: '👋 Farewell Message',
      titleAlignment: 'center'
    }
  ));
  
  console.log('\n' + gradients.rainbow('   ▶ Happy analyzing! Keep discovering insights! ◀') + '\n');
}

async function showAboutInfo() {
  console.clear();
  
  const aboutHeader = `
  ╔═════════════════════════════════════════════════════════════╗
  ║                   📋 ABOUT DATAPILOT 📋                    ║
  ║                  Your Data Analysis Co-Pilot                ║
  ╚═════════════════════════════════════════════════════════════╝`;
  
  console.log(gradients.title(aboutHeader));
  
  console.log('\\n' + boxen(
    gradients.cyan('DataPilot v1.1.0\\n\\n') +
    gradients.green('🛩️ Your Data Analysis Co-Pilot\\n') +
    gradients.blue('📊 Comprehensive CSV analysis suite\\n') +
    gradients.yellow('🤖 AI-ready context generation\\n') +
    gradients.magenta('🔍 Data quality & integrity checks\\n') +
    gradients.white('📈 Visualization recommendations\\n') +
    gradients.cyan('🏗️ Data engineering archaeology\\n\\n') +
    gradients.subtle('Built with Node.js + modern CLI tools\\n') +
    gradients.subtle('Open source & actively maintained\\n') +
    gradients.subtle('Created for analysts by analysts'),
    {
      padding: 1,
      borderColor: 'cyan',
      title: '📊 System Information',
      titleAlignment: 'center'
    }
  ));
  
  await safePrompt({ type: 'confirm', name: 'continue', message: '\\nPress Enter to continue...' });
}


async function showSettings(engine, result) {
  console.clear();
  
  // Enhanced settings header
  const settingsHeader = `
  ╔═════════════════════════════════════════════════════════════╗
  ║                ⚙️  SETTINGS & PREFERENCES ⚙️                ║
  ║                Configure DataPilot behavior                  ║
  ╚═════════════════════════════════════════════════════════════╝`;
  
  console.log(gradients.blue(settingsHeader));
  
  console.log('\\n' + boxen(
    gradients.yellow('🛠️  Configuration Options Coming Soon! 🛠️\\n\\n') +
    'Settings will include:\\n' +
    gradients.green('• 🎨 Color Theme Selection\\n') +
    gradients.blue('• 📊 Default Analysis Types\\n') +
    gradients.cyan('• 💾 Memory Management Preferences\\n') +
    gradients.magenta('• 📁 Default File Search Paths\\n') +
    gradients.yellow('• ⚡ Performance Optimization\\n') +
    gradients.red('• 🔔 Notification Preferences'),
    {
      padding: 1,
      borderStyle: 'round',
      borderColor: 'blue',
      title: '⚙️  Customization',
      titleAlignment: 'center'
    }
  ));
  
  console.log();
  
  // Provide actual navigation menu instead of just confirmation
  let inSettings = true;
  while (inSettings) {
    const response = await safePrompt({
      type: 'select',
      name: 'action',
      message: gradients.cyan('What would you like to do?'),
      choices: [
        {
          name: 'themes',
          message: '🎨 Color Themes (Coming Soon)',
          hint: 'Customize DataPilot appearance'
        },
        {
          name: 'defaults',
          message: '📊 Default Analysis Types (Coming Soon)',
          hint: 'Set preferred analysis modes'
        },
        {
          name: 'memory',
          message: '💾 Memory Preferences (Coming Soon)',
          hint: 'Configure knowledge storage'
        },
        {
          name: 'paths',
          message: '📁 File Search Paths (Coming Soon)',
          hint: 'Set default directories'
        },
        {
          name: 'performance',
          message: '⚡ Performance Options (Coming Soon)',
          hint: 'Optimize for your system'
        },
        {
          name: 'about',
          message: '📋 About DataPilot',
          hint: 'Version and system information'
        },
        {
          name: 'back',
          message: '⬅️  Back to Main Menu',
          hint: 'Return to main menu'
        }
      ]
    });
    
    switch (response.action) {
      case 'about':
        await showAboutInfo();
        break;
      case 'back':
        inSettings = false;
        break;
      default:
        console.log(gradients.yellow('\\n⚠️  This feature is coming soon!'));
        await safePrompt({ type: 'confirm', name: 'continue', message: 'Press Enter to continue...' });
        break;
    }
  }
}