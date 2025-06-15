/**
 * Data Preview Generator - Creates structured data samples for Section 1 Overview
 * Generates configurable row previews with intelligent sampling strategies
 */

import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { statSync } from 'fs';
import type { DataPreview, Section1Config, Section1Warning } from './types';

export class DataPreviewGenerator {
  private config: Section1Config;
  private warnings: Section1Warning[] = [];

  constructor(config: Section1Config) {
    this.config = config;
  }

  /**
   * Generate data preview with configurable row count and sampling strategy
   */
  async generatePreview(filePath: string): Promise<DataPreview> {
    const startTime = Date.now();
    
    try {
      const fileStats = statSync(filePath);
      const fileSizeBytes = fileStats.size;
      
      // Determine preview strategy based on file size and configuration
      const previewMethod = this.determinePreviewMethod(fileSizeBytes);
      const maxRows = this.config.previewRows || 5;
      
      let preview: DataPreview;
      
      switch (previewMethod) {
        case 'head':
          preview = await this.generateHeadPreview(filePath, maxRows);
          break;
        case 'sample':
          preview = await this.generateSampledPreview(filePath, maxRows);
          break;
        case 'stratified':
          preview = await this.generateStratifiedPreview(filePath, maxRows);
          break;
        default:
          preview = await this.generateHeadPreview(filePath, maxRows);
      }
      
      const endTime = Date.now();
      preview.generationTimeMs = endTime - startTime;
      preview.previewMethod = previewMethod;
      
      return preview;
    } catch (error) {
      // Fallback preview on error
      return {
        headerRow: undefined,
        sampleRows: [],
        totalRowsShown: 0,
        totalRowsInFile: 0,
        truncated: false,
        previewMethod: 'head',
        generationTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Determine the best preview method based on file characteristics
   */
  private determinePreviewMethod(fileSizeBytes: number): 'head' | 'sample' | 'stratified' {
    const fileSizeMB = fileSizeBytes / (1024 * 1024);
    
    // For small files, just show the head
    if (fileSizeMB < 10) return 'head';
    
    // For medium files, use sampling
    if (fileSizeMB < 100) return 'sample';
    
    // For large files, use stratified sampling
    return 'stratified';
  }

  /**
   * Generate preview showing first N rows (head strategy)
   */
  private async generateHeadPreview(filePath: string, maxRows: number): Promise<DataPreview> {
    return new Promise((resolve, reject) => {
      const rows: string[][] = [];
      let headerRow: string[] | undefined;
      let totalRowsInFile = 0;
      let isFirstRow = true;
      
      const fileStream = createReadStream(filePath, { encoding: 'utf8' });
      const rl = createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      rl.on('line', (line) => {
        totalRowsInFile++;
        
        if (line.trim() === '') return; // Skip empty lines
        
        const columns = this.parseCSVLine(line);
        
        if (isFirstRow) {
          headerRow = columns;
          isFirstRow = false;
        } else if (rows.length < maxRows) {
          rows.push(columns);
        } else {
          // We have enough rows, stop reading
          fileStream.destroy();
          rl.close();
        }
      });

      rl.on('close', () => {
        resolve({
          headerRow,
          sampleRows: rows,
          totalRowsShown: rows.length,
          totalRowsInFile: totalRowsInFile - (headerRow ? 1 : 0), // Subtract header if present
          truncated: totalRowsInFile > maxRows + 1, // +1 for header
          previewMethod: 'head',
          generationTimeMs: 0, // Will be set by caller
        });
      });

      rl.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Generate preview using random sampling (sample strategy)
   */
  private async generateSampledPreview(filePath: string, maxRows: number): Promise<DataPreview> {
    return new Promise((resolve, reject) => {
      const allRows: string[][] = [];
      let headerRow: string[] | undefined;
      let totalRowsInFile = 0;
      let isFirstRow = true;
      
      const fileStream = createReadStream(filePath, { encoding: 'utf8' });
      const rl = createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      rl.on('line', (line) => {
        totalRowsInFile++;
        
        if (line.trim() === '') return; // Skip empty lines
        
        const columns = this.parseCSVLine(line);
        
        if (isFirstRow) {
          headerRow = columns;
          isFirstRow = false;
        } else {
          allRows.push(columns);
        }
      });

      rl.on('close', () => {
        // Sample rows randomly
        const sampleRows = this.randomSample(allRows, maxRows);
        
        resolve({
          headerRow,
          sampleRows,
          totalRowsShown: sampleRows.length,
          totalRowsInFile: allRows.length,
          truncated: allRows.length > maxRows,
          previewMethod: 'sample',
          generationTimeMs: 0, // Will be set by caller
        });
      });

      rl.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Generate preview using stratified sampling (stratified strategy)
   */
  private async generateStratifiedPreview(filePath: string, maxRows: number): Promise<DataPreview> {
    // For large files, we'll read a limited number of lines and sample from those
    const maxLinesToRead = Math.max(1000, maxRows * 20); // Read 20x the desired rows or minimum 1000
    
    return new Promise((resolve, reject) => {
      const allRows: string[][] = [];
      let headerRow: string[] | undefined;
      let totalRowsInFile = 0;
      let isFirstRow = true;
      let linesRead = 0;
      
      const fileStream = createReadStream(filePath, { encoding: 'utf8' });
      const rl = createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      rl.on('line', (line) => {
        totalRowsInFile++;
        linesRead++;
        
        if (line.trim() === '') return; // Skip empty lines
        
        const columns = this.parseCSVLine(line);
        
        if (isFirstRow) {
          headerRow = columns;
          isFirstRow = false;
        } else {
          allRows.push(columns);
        }
        
        // Stop reading after maxLinesToRead
        if (linesRead >= maxLinesToRead) {
          fileStream.destroy();
          rl.close();
        }
      });

      rl.on('close', () => {
        // Use stratified sampling: take rows from beginning, middle, and end
        const sampleRows = this.stratifiedSample(allRows, maxRows);
        
        resolve({
          headerRow,
          sampleRows,
          totalRowsShown: sampleRows.length,
          totalRowsInFile: allRows.length, // Note: This is approximate for large files
          truncated: true, // Always truncated for large files
          previewMethod: 'stratified',
          generationTimeMs: 0, // Will be set by caller
        });
      });

      rl.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Simple CSV line parser (handles basic quoting)
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        if (nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = false;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
      
      i++;
    }
    
    // Add the last column
    result.push(current.trim());
    
    return result;
  }

  /**
   * Random sampling from array
   */
  private randomSample<T>(array: T[], sampleSize: number): T[] {
    if (array.length <= sampleSize) return array;
    
    const sampled: T[] = [];
    const indices = new Set<number>();
    
    while (sampled.length < sampleSize && indices.size < array.length) {
      const randomIndex = Math.floor(Math.random() * array.length);
      if (!indices.has(randomIndex)) {
        indices.add(randomIndex);
        sampled.push(array[randomIndex]);
      }
    }
    
    return sampled;
  }

  /**
   * Stratified sampling: take rows from beginning, middle, and end
   */
  private stratifiedSample<T>(array: T[], sampleSize: number): T[] {
    if (array.length <= sampleSize) return array;
    
    const sampled: T[] = [];
    const segmentSize = Math.floor(sampleSize / 3); // Split into 3 segments
    const remainder = sampleSize % 3;
    
    // Beginning segment
    const beginningCount = segmentSize + (remainder > 0 ? 1 : 0);
    for (let i = 0; i < beginningCount && i < array.length; i++) {
      sampled.push(array[i]);
    }
    
    // Middle segment
    const middleStart = Math.floor(array.length / 2) - Math.floor(segmentSize / 2);
    const middleCount = segmentSize + (remainder > 1 ? 1 : 0);
    for (let i = 0; i < middleCount && middleStart + i < array.length; i++) {
      sampled.push(array[middleStart + i]);
    }
    
    // End segment
    const endStart = Math.max(array.length - segmentSize, middleStart + middleCount);
    for (let i = endStart; i < array.length && sampled.length < sampleSize; i++) {
      sampled.push(array[i]);
    }
    
    return sampled;
  }

  /**
   * Get collected warnings
   */
  getWarnings(): Section1Warning[] {
    return [...this.warnings];
  }

  /**
   * Clear warnings
   */
  clearWarnings(): void {
    this.warnings = [];
  }
}