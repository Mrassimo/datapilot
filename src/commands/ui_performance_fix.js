/**
 * Performance optimization for TUI with large files
 * Adds progress updates and prevents freezing
 */

export async function parseCSVWithProgress(filePath, onProgress) {
  const { parseCSV } = await import('../utils/parser.js');
  
  // Add progress callback
  const options = {
    quiet: false,
    onProgress: (progress, rowCount) => {
      if (onProgress) {
        onProgress({
          percentage: Math.round(progress),
          rowCount: rowCount,
          status: `Processing ${rowCount.toLocaleString()} rows (${Math.round(progress)}%)`
        });
      }
    }
  };
  
  return parseCSV(filePath, options);
}

export function createProgressSpinner(spinner) {
  let lastUpdate = Date.now();
  const updateInterval = 100; // Update every 100ms
  
  return {
    update: (progress) => {
      const now = Date.now();
      if (now - lastUpdate >= updateInterval) {
        spinner.text = progress.status;
        lastUpdate = now;
      }
    },
    complete: () => {
      spinner.succeed('File loaded successfully!');
    },
    error: (message) => {
      spinner.fail(message);
    }
  };
}

// Check if file is large before loading
export async function isLargeFile(filePath) {
  const fs = await import('fs');
  const stats = await fs.promises.stat(filePath);
  
  // Consider files > 10MB as large
  return stats.size > 10 * 1024 * 1024;
}

// Optimized analysis runner that yields control periodically
export async function runAnalysisWithYield(analysisFunc, data, options) {
  const chunkSize = 1000;
  const totalRows = data.length;
  
  // For small datasets, run normally
  if (totalRows < chunkSize) {
    return analysisFunc(data, options);
  }
  
  // For large datasets, process in chunks with yielding
  const chunks = [];
  for (let i = 0; i < totalRows; i += chunkSize) {
    chunks.push(data.slice(i, Math.min(i + chunkSize, totalRows)));
  }
  
  // Process chunks with periodic yielding
  let processedRows = 0;
  for (const chunk of chunks) {
    // Yield control to event loop
    await new Promise(resolve => setImmediate(resolve));
    
    processedRows += chunk.length;
    if (options.onProgress) {
      options.onProgress({
        percentage: Math.round((processedRows / totalRows) * 100),
        rowCount: processedRows,
        status: `Analyzing ${processedRows.toLocaleString()} of ${totalRows.toLocaleString()} rows`
      });
    }
  }
  
  return analysisFunc(data, options);
}