/**
 * Standalone file browser implementation that properly handles navigation
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import blessed from 'blessed';

export async function browseForFileBlessed() {
  return new Promise((resolve) => {
    // Create screen
    const screen = blessed.screen({
      smartCSR: true,
      title: 'DataPilot File Browser'
    });

    let currentPath = process.cwd();
    
    // Create main box
    const mainBox = blessed.box({
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      border: {
        type: 'line'
      },
      style: {
        border: {
          fg: 'cyan'
        }
      }
    });

    // Create header
    const header = blessed.text({
      parent: mainBox,
      top: 0,
      left: 'center',
      content: '📂 FILE BROWSER',
      style: {
        fg: 'cyan',
        bold: true
      }
    });

    // Create path display
    const pathDisplay = blessed.text({
      parent: mainBox,
      top: 2,
      left: 2,
      content: `Current: ${currentPath}`,
      style: {
        fg: 'yellow'
      }
    });

    // Create file list
    const fileList = blessed.list({
      parent: mainBox,
      top: 4,
      left: 2,
      width: '96%',
      height: '80%',
      keys: true,
      vi: true,
      mouse: true,
      scrollbar: {
        ch: ' ',
        inverse: true
      },
      style: {
        selected: {
          bg: 'blue',
          fg: 'white',
          bold: true
        },
        item: {
          fg: 'white'
        }
      }
    });

    // Create help text
    const help = blessed.text({
      parent: mainBox,
      bottom: 0,
      left: 2,
      content: 'Navigate: ↑↓ arrows | Select: Enter | Cancel: ESC or q',
      style: {
        fg: 'gray'
      }
    });

    screen.append(mainBox);

    // Function to update file list
    function updateFileList() {
      pathDisplay.setContent(`Current: ${currentPath}`);
      
      const items = [];
      const itemData = [];
      
      // Add parent directory option if not at root
      if (currentPath !== '/') {
        items.push('📁 .. (parent directory)');
        itemData.push({ type: 'parent', path: path.dirname(currentPath) });
      }
      
      try {
        const files = fs.readdirSync(currentPath);
        
        // Separate and sort directories and CSV files
        const directories = [];
        const csvFiles = [];
        
        files.forEach(file => {
          const fullPath = path.join(currentPath, file);
          try {
            const stats = fs.statSync(fullPath);
            if (stats.isDirectory()) {
              directories.push({ name: file, path: fullPath, stats });
            } else if (file.toLowerCase().endsWith('.csv')) {
              csvFiles.push({ name: file, path: fullPath, stats });
            }
          } catch (e) {
            // Skip inaccessible files
          }
        });
        
        // Sort alphabetically
        directories.sort((a, b) => a.name.localeCompare(b.name));
        csvFiles.sort((a, b) => a.name.localeCompare(b.name));
        
        // Add directories
        directories.forEach(dir => {
          items.push(`📁 ${dir.name}/`);
          itemData.push({ type: 'directory', path: dir.path });
        });
        
        // Add CSV files
        csvFiles.forEach(file => {
          const size = file.stats.size;
          const sizeStr = size < 1024 ? `${size}B` :
                         size < 1024 * 1024 ? `${(size / 1024).toFixed(1)}KB` :
                         `${(size / (1024 * 1024)).toFixed(1)}MB`;
          items.push(`📄 ${file.name} (${sizeStr})`);
          itemData.push({ type: 'file', path: file.path });
        });
        
      } catch (error) {
        items.push(`Error reading directory: ${error.message}`);
      }
      
      fileList.setItems(items);
      fileList.data = itemData;
      fileList.select(0);
      screen.render();
    }

    // Initial update
    updateFileList();

    // Handle selection
    fileList.on('select', (item, index) => {
      const data = fileList.data[index];
      if (!data) return;
      
      if (data.type === 'parent' || data.type === 'directory') {
        currentPath = data.path;
        updateFileList();
      } else if (data.type === 'file') {
        screen.destroy();
        resolve(data.path);
      }
    });

    // Handle keyboard
    screen.key(['escape', 'q', 'C-c'], () => {
      screen.destroy();
      resolve(null);
    });

    fileList.focus();
    screen.render();
  });
}