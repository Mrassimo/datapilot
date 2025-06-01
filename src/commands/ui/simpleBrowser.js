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