#!/usr/bin/env node
/**
 * Cross-platform clean script
 * Works on Windows, macOS, and Linux
 */

const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist');

function deleteRecursive(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dirPath);
    console.log(`✓ Cleaned ${dirPath}`);
  }
}

// Clean dist directory
deleteRecursive(distPath);