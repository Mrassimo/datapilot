/**
 * Simple file browser that works reliably with enquirer
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import enquirer from 'enquirer';

const { Select } = enquirer;

// Custom prompt that handles rendering properly
class FileBrowserPrompt extends Select {
  constructor(options) {
    super(options);
    this.cursorHide();
  }
  
  async render() {
    // Clear previous renders completely
    if (this.state.submitted || this.state.cancelled) return;
    
    // Clear screen and move cursor to top
    process.stdout.write('\u001b[2J\u001b[0;0H');
    
    // Render our UI
    let output = '';
    output += chalk.cyan('📂 FILE BROWSER\n');
    output += chalk.yellow(`Current: ${this.currentPath}\n\n`);
    
    await super.render();
  }
}

export async function browseForFileSimple() {
  let currentPath = process.cwd();
  let selectedFile = null;
  
  while (selectedFile === null) {
    try {
      // Get directory contents
      const items = [];
      const actions = new Map();
      
      // Add parent directory if not at root
      if (currentPath !== '/') {
        const parentOption = '📁 .. (parent directory)';
        items.push(parentOption);
        actions.set(parentOption, { type: 'parent', path: path.dirname(currentPath) });
      }
      
      // Read directory
      const files = fs.readdirSync(currentPath);
      const dirs = [];
      const csvs = [];
      
      for (const file of files) {
        const fullPath = path.join(currentPath, file);
        try {
          const stats = fs.statSync(fullPath);
          if (stats.isDirectory()) {
            dirs.push({ name: file, path: fullPath });
          } else if (file.toLowerCase().endsWith('.csv')) {
            csvs.push({ name: file, path: fullPath, size: stats.size });
          }
        } catch (e) {
          // Skip inaccessible items
        }
      }
      
      // Sort and add to items
      dirs.sort((a, b) => a.name.localeCompare(b.name));
      csvs.sort((a, b) => a.name.localeCompare(b.name));
      
      dirs.forEach(dir => {
        const option = `📁 ${dir.name}/`;
        items.push(option);
        actions.set(option, { type: 'dir', path: dir.path });
      });
      
      csvs.forEach(csv => {
        const sizeStr = csv.size < 1024 ? `${csv.size}B` :
                       csv.size < 1024 * 1024 ? `${(csv.size / 1024).toFixed(1)}KB` :
                       `${(csv.size / (1024 * 1024)).toFixed(1)}MB`;
        const option = `📄 ${csv.name} (${sizeStr})`;
        items.push(option);
        actions.set(option, { type: 'file', path: csv.path });
      });
      
      // Add cancel option
      const cancelOption = '❌ Cancel';
      items.push(cancelOption);
      actions.set(cancelOption, { type: 'cancel' });
      
      // Clear screen before prompt
      process.stdout.write('\u001b[2J\u001b[0;0H');
      console.log(chalk.cyan('📂 FILE BROWSER'));
      console.log(chalk.yellow(`Current: ${currentPath}\n`));
      
      // Use standard Select prompt
      const prompt = new Select({
        name: 'selection',
        message: 'Navigate with ↑↓ arrows, Enter to select:',
        choices: items,
        initial: 0
      });
      
      // Let enquirer handle rendering naturally for proper navigation
      
      const answer = await prompt.run();
      const action = actions.get(answer);
      
      if (action.type === 'cancel') {
        return null;
      } else if (action.type === 'parent' || action.type === 'dir') {
        currentPath = action.path;
        // Clear screen before next iteration
        process.stdout.write('\u001b[2J\u001b[0;0H');
      } else if (action.type === 'file') {
        return action.path;
      }
      
    } catch (error) {
      console.log(chalk.red(`Error: ${error.message}`));
      return null;
    }
  }
  
  return selectedFile;
}

export async function browseForMultipleFiles() {
  let currentPath = process.cwd();
  let selectedFiles = [];
  let browsing = true;
  
  while (browsing) {
    try {
      // Get directory contents
      const items = [];
      const actions = new Map();
      
      // Add parent directory if not at root
      if (currentPath !== '/') {
        const parentOption = '📁 .. (parent directory)';
        items.push(parentOption);
        actions.set(parentOption, { type: 'parent', path: path.dirname(currentPath) });
      }
      
      // Read directory
      const files = fs.readdirSync(currentPath);
      const dirs = [];
      const csvs = [];
      
      for (const file of files) {
        const fullPath = path.join(currentPath, file);
        try {
          const stats = fs.statSync(fullPath);
          if (stats.isDirectory()) {
            dirs.push({ name: file, path: fullPath });
          } else if (file.toLowerCase().endsWith('.csv')) {
            csvs.push({ name: file, path: fullPath, size: stats.size });
          }
        } catch (e) {
          // Skip inaccessible items
        }
      }
      
      // Sort and add to items
      dirs.sort((a, b) => a.name.localeCompare(b.name));
      csvs.sort((a, b) => a.name.localeCompare(b.name));
      
      dirs.forEach(dir => {
        const option = `📁 ${dir.name}/`;
        items.push(option);
        actions.set(option, { type: 'dir', path: dir.path });
      });
      
      csvs.forEach(csv => {
        const sizeStr = csv.size < 1024 ? `${csv.size}B` :
                       csv.size < 1024 * 1024 ? `${(csv.size / 1024).toFixed(1)}KB` :
                       `${(csv.size / (1024 * 1024)).toFixed(1)}MB`;
        
        // Show checkbox indicator
        const isSelected = selectedFiles.includes(csv.path);
        const checkbox = isSelected ? '✅' : '☐';
        const option = `${checkbox} ${csv.name} (${sizeStr})`;
        items.push(option);
        actions.set(option, { type: 'file', path: csv.path });
      });
      
      // Add separator and actions
      if (csvs.length > 0) {
        items.push('─────────────────────');
        actions.set('─────────────────────', { type: 'separator' });
        
        // Add selection actions
        if (selectedFiles.length > 0) {
          const continueOption = `✅ Continue with ${selectedFiles.length} selected file${selectedFiles.length !== 1 ? 's' : ''}`;
          items.push(continueOption);
          actions.set(continueOption, { type: 'continue' });
          
          const clearOption = '🗑️  Clear all selections';
          items.push(clearOption);
          actions.set(clearOption, { type: 'clear' });
        }
      }
      
      // Add cancel option
      const cancelOption = '❌ Cancel';
      items.push(cancelOption);
      actions.set(cancelOption, { type: 'cancel' });
      
      // Clear screen before prompt
      process.stdout.write('\u001b[2J\u001b[0;0H');
      console.log(chalk.cyan('📂 MULTIPLE FILE BROWSER'));
      console.log(chalk.yellow(`Current: ${currentPath}`));
      if (selectedFiles.length > 0) {
        console.log(chalk.green(`Selected: ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''}`));
        selectedFiles.forEach(filePath => {
          console.log(chalk.gray(`  • ${path.basename(filePath)}`));
        });
      }
      console.log('');
      
      // Use standard Select prompt
      const prompt = new Select({
        name: 'selection',
        message: 'Space to toggle, ↑↓ to navigate, Enter to select:',
        choices: items,
        initial: 0
      });
      
      const answer = await prompt.run();
      const action = actions.get(answer);
      
      if (!action) continue;
      
      if (action.type === 'cancel') {
        return null;
      } else if (action.type === 'parent' || action.type === 'dir') {
        currentPath = action.path;
        // Clear screen before next iteration
        process.stdout.write('\u001b[2J\u001b[0;0H');
      } else if (action.type === 'file') {
        // Toggle file selection
        const filePath = action.path;
        const index = selectedFiles.indexOf(filePath);
        if (index > -1) {
          selectedFiles.splice(index, 1);
        } else {
          selectedFiles.push(filePath);
        }
        // Clear screen before next iteration
        process.stdout.write('\u001b[2J\u001b[0;0H');
      } else if (action.type === 'continue') {
        if (selectedFiles.length > 0) {
          return selectedFiles;
        }
      } else if (action.type === 'clear') {
        selectedFiles = [];
        // Clear screen before next iteration
        process.stdout.write('\u001b[2J\u001b[0;0H');
      }
      
    } catch (error) {
      console.log(chalk.red(`Error: ${error.message}`));
      return null;
    }
  }
  
  return selectedFiles.length > 0 ? selectedFiles : null;
}